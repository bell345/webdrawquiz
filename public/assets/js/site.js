/**
 * Created by thomas on 2016-09-26 at 23:09.
 *
 * MIT Licensed
 */

var wm;

function reportError(message, error) {
    if (!error) error = null;
    else if (error.responseJSON) error = error.responseJSON;
    else if (error.responseText) try {
        error = JSON.parse(error.responseText);
    } catch (e) { error = error.responseText; }
    else if (error.statusText) error = error.statusText;

    var errtext = error
        ? "<code>" + (error.error_description || error) + "</code>"
        : "";

    wm.spawn(JSWM.Dialog, "An error occurred.",
        "<p>" + message + "</p>" +
        errtext,
        { x: "8%", y: "8%", width: "84%", height: "84%",
            shadow: true, dialogOptions: JSWM.DialogOptions.ok }
    );

    //$(".shadow").addClass("show");
    //var $note = $(".fullscreen-notification");
    //$note.find("h2").html("An error occurred.");
    //$note.find("div.body").html(
    //    "<p>" + message + "</p>"
    //    + (error
    //        ? "<pre><code>" + (error.error_description || error) + "</code></pre>"
    //        : "")
    //);
}

function WSManager(auth_cookie) {
    this.auth_cookie = auth_cookie || "access_token";
    this.authenticated = false;
    var self = this;
    $(this).on("authenticated", function (msg) {
        self.authenticated = true;
    });
}
WSManager.prototype = {
    constructor: WSManager,
    authenticated: false,
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

        if (endpoint || !this.uri)
            this.uri = protocol + location.host + location.pathname + (endpoint || "");

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
                    reportError("A WebSocket error has occurred: ",
                        msg.error_type + ": " + msg.error_description);
                    break;
            }
            if (msg.authenticated && !self.authenticated) {
                self.trigger("authenticated", msg);
                self.authenticated = true;
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
    send: function (type, payload, callback) {
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
            callback(msg.message);
        });
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