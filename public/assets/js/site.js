/**
 * Created by thomas on 2016-09-26 at 23:09.
 *
 * MIT Licensed
 */

//function reportError(message, error) {
//    if (!error) error = null;
//    else if (error.responseJSON) error = error.responseJSON;
//    else if (error.responseText) try {
//        error = JSON.parse(error.responseText);
//    } catch (e) { error = error.responseText; }
//    else if (error.statusText) error = error.statusText;
//
//    var errtext = error
//        ? "<code>" + (error.error_description || error) + "</code>"
//        : "";
//
//    wm.spawn(JSWM.Dialog, "An error occurred.",
//        "<p>" + message + "</p>" +
//        errtext,
//        { x: "8%", y: "8%", width: "84%", height: "84%",
//            shadow: true, dialogOptions: JSWM.DialogOptions.ok }
//    );
//
//    //$(".shadow").addClass("show");
//    //var $note = $(".fullscreen-notification");
//    //$note.find("h2").html("An error occurred.");
//    //$note.find("div.body").html(
//    //    "<p>" + message + "</p>"
//    //    + (error
//    //        ? "<pre><code>" + (error.error_description || error) + "</code></pre>"
//    //        : "")
//    //);
//}

var state = "default";
var LEGAL_STATE_TRANSITIONS = {
    "default": ["error"]
};

function changeState(newState) {
    if (LEGAL_STATE_TRANSITIONS[state] !== undefined
    && typeof LEGAL_STATE_TRANSITIONS[state] === typeof []
    && LEGAL_STATE_TRANSITIONS[state].indexOf(newState) !== -1) {
        $("body").removeClass("state-" + state)
                .addClass("state-" + newState);

        $(".only").removeClass("show");
        $(".only.state-" + newState).addClass("show");

        state = newState;
        return true;
    } else return false;
}

function reportError(message, error) {
    if (!changeState("error")) return;

    if (!error) error = null;
    else if (error.responseJSON) error = error.responseJSON;
    else if (error.responseText) try {
        error = JSON.parse(error.responseText);
    } catch (e) { error = error.responseText }
    else if (error.statusText) error = error.statusText;

    var errtext = error
            ? (error.error_description || error)
            : "";

    console.error(message, errtext);

    displayOverlay("error",
            "<h2>An error has occurred</h2>"
            + "<h4>" + message + "</h4>"
            + "<p>" + errtext + "</p>"
            + "<button onclick='hideOverlay();'>OK</button>"
            + "<button onclick='location.reload();'>Reload</button>"
    );
}

function displayOverlay(overlay_name, contents) {
    hideOverlay();
    $(".overlay-container").addClass("show");
    var overlay = $(".overlay-container > div." + overlay_name);
    overlay.addClass("show");
    if (contents) overlay.html(contents);
}

function hideOverlay() {
    $(".overlay-container > div").removeClass("show");
    $(".overlay-container").removeClass("show");
}

function WSManager(auth_cookie) {
    this.auth_cookie = auth_cookie || "access_token";
    this.authenticated = null;
    var self = this;
    $(this).on("authenticated", function (msg) {
        self.authenticated = true;
    });
}
WSManager.prototype = {
    constructor: WSManager,
    _eventRedirect: function (name) {
        var self = this;
        if (arguments.length > 1) {
            var args = [].splice.call(arguments, 0);
            args.forEach(function (e) { self._eventRedirect(e); });
        }

        $(this.socket).on(name, function () {
            $(self).trigger.apply($(self), [name].concat(arguments));
        });
    },
    open: function (endpoint) {
        var protocol = "ws://";
        if (location.protocol === "https:")
            protocol = "wss://";

        if (endpoint || !this.uri) {
            if (endpoint && endpoint[0] !== "/")
                this.uri = protocol + location.host + location.pathname + (endpoint || "");
            else
                this.uri = protocol + location.host + (endpoint || "");
        }

        this.socket = new WebSocket(this.uri);

        var self = this;
        this.on("open", function () {
            self.send("auth", {
                token: readCookie(self.auth_cookie)
            });
        });
        this.on("message", function (event) {
            var msg = JSON.parse(event.originalEvent.data);
            //console.log("Server payload");
            //console.log(msg);
            switch (msg.type) {
                case "error":
                    if (msg.id) self.trigger("message-error." + msg.id, msg);
                    return reportError("A WebSocket error has occurred: ",
                        msg.error_type + ": " + msg.error_description);
                    break;
            }
            if (msg.authenticated && !self.authenticated) {
                self.trigger("authenticated", msg);
                self.authenticated = true;
            } else if (msg.authenticated !== undefined && !msg.authenticated) {
                self.trigger("unauthenticated", msg);
                self.authenticated = false;
            }
            if (msg.type) self.trigger("message-type." + msg.type, msg);
            if (msg.id) self.trigger("message-id." + msg.id, msg);
        });
    },
    close: function () {
        this.socket.close();
    },
    ensureOpen: function (endpoint) {
        var self = this;

        function state(prop) { return self.socket.readyState == self.socket[prop]; }

        if (state("CLOSED")) try {
            this.open(endpoint);
        } catch (e) { return false; }

        return state("OPEN");
    },
    send: function (type, payload, callback, errorCallback) {
        if (!this.ensureOpen()) return;
        if (typeof payload == "string") {
            var obj = {};
            obj[type] = payload;
            payload = obj;
        }
        payload.type = type;
        payload.id = generateUUID();
        //payload.token = readCookie("access_token");

        //console.log("Client payload");
        //console.log(payload);

        this.socket.send(JSON.stringify(payload));

        if (!callback) return;
        this.on("message-id." + payload.id, function handler(e, msg) {
            callback(msg);
        });

        if (!errorCallback) return;
        this.on("message-error." + payload.id, function handler(e, msg) {
            errorCallback(msg);
        })
    },
    on: function () {
        var sock = $(this.socket);
        sock.on.apply(sock, arguments);
    },
    off: function () {
        var sock = $(this.socket);
        sock.off.apply(sock, arguments);
    },
    trigger: function () {
        var sock = $(this.socket);
        sock.trigger.apply(sock, arguments);
    }
};
