
function JSWM(rootElement) {
    this.rootElement = rootElement;
    this.elements = {};
}
JSWM.prototype.getAllElements = function (filter) {
    filter = filter || function () { return true; };
    var arr = [];
    for (var id in this.elements) if (this.elements.hasOwnProperty(id))
        arr.push(this.elements[id]);
        
    return arr.filter(filter);
};
JSWM.prototype.createWindow = function (title, body, config) {
    return this.spawn(JSWM.Window, title, body, config);
};
JSWM.prototype.spawn = function (constructor) {
    constructor = constructor || JSWM.Element;
    var args = [this, this];
    for (var i=1;i<arguments.length;i++) args.push(arguments[i]);

    var el = new (constructor.bind.apply(constructor, args));
    this.elements[el.id] = el;
    this.rootElement.appendChild(el.element);
    return el;
};
JSWM.prototype.selectWindow = function (win) {
    var kot = JSWM.WindowFlags.keepOnTop;
    if (win.flags | kot) {
        win.element.style.zIndex = 9999;
        return;
    }
    var els = this.getAllElements(function (o) {
        return o instanceof JSWM.Window && !(o.flags | kot);
    });
    
    var maxZIndex = els.length;
    els.sort(function (a, b) {
        if (a.element && b.element)
            return a.element.getStyle("zIndex") || 0 < b.element.getStyle("zIndex") || 0;
        else return a;
    }).forEach(function (e, i) {
        e.element.style.zIndex = i;
    });
    
    win.element.style.zIndex = maxZIndex + 1;
    
    $(".window.selected").removeClass("selected");
    $(win.element).addClass("selected");
};
JSWM.Element = function (wm) {
    this.id = generateUUID();
    this.visible = true;
    this.wm = wm;
};
JSWM.WindowFlags = {
    minimise: 1,
    maximise: 2,
    resize: 4,
    bound: 8,
    keepOnTop: 16
};
JSWM.DialogOptions = {
    ok: 1,
    cancel: 2,
    apply: 4
};

var windowTemplate = [
    "<div class='window-header'>",
        "<img class='window-icon' alt='' />",
        "<h2 class='window-title'>",
        "</h2>",
        "<div class='window-header-buttons'>",
            "<div class='window-header-close'></div>",
            "<div class='window-header-minimise'></div>",
            "<div class='window-header-maximise'></div>",
        "</div>",
    "</div>",
    "<div class='window-content'>",
        "<div class='window-body'></div>",
    "</div>",
    "<div class='window-resizer'></div>"
].join("\n");


function setHomogenousStyleProperty(style, name, value) {
    value = value.toString();
    if (value.search("%") != -1 || value.search("px") != -1)
        style[name] = value;
    else if (Math.abs(parseFloat(value)) <= 1)
        style[name] = (Math.abs(parseFloat(value)) * 100) + "%";
    else style[name] = parseFloat(value) + "px";
    return style;
}

/**
 * Create a window object with a given title and body content.
 * Other window-like objects (dialogs, for instance) should inherit from this.
 * @param wm The window manager to bind to.
 * @param title The title of the window.
 * @param body The body content of the window, as a HTML string.
 * @param config A set of key-value pairs that define other properties of the window.
 * Below is a summary of supported keys:
 *  title: Can be given instead of the parameter of the same name.
 *  body: Can be given instead of the parameter of the same name.
 *  flags: An bit-field that represents boolean properties of the window.
 *      For valid flags, refer to JSWM.WindowFlags. {@ref JSWM.WindowFlags}
 *  css: A set of key/value pairs that represent different CSS properties
 *      to be specified on the window element.
 *  icon: A URL where a window icon can be found.
 *  class: Either a string to be appended to the class attribute,
 *      or an array of classes to be added to the window.
 *  x: The x position of the window.
 *  y: The y position of the window.
 *  width: The width of the window.
 *  height: The height of the window.
 * @constructor
 */
JSWM.Window = function (wm, title, body, config) {
    if (typeof title !== typeof "") {
        config = title;
        title = "";
        body = "";
    }
    var wf = JSWM.WindowFlags;
    
    JSWM.Element.call(this, wm);
    config = config || {};
    config.title = config.title || title;
    config.body = config.body || body;
    config.flags = isNull(config.flags) 
        ? wf.minimise | wf.maximise | wf.resize 
        : config.flags;
    this.config = config;

    var win;
    if (isNull(config.element)) {
        win = document.createElement("div");
        win.className = "window";
        win.innerHTML = windowTemplate;
        this.element = win;
    } else {
        win = config.element;
        this.element = config.element;
    }
    
    var $w = $(win),
        h = setHomogenousStyleProperty;
    
    h(win.style, "left", config.x || 0);
    h(win.style, "top", config.y || 0);
    h(win.style, "width", config.width || 240);
    h(win.style, "height", config.height || 180);
    
    if (config.macStyleHeader)
        $w.find(".window-header").addClass("mac-style");
    if (config.shadow)
        $w.addClass("has-shadow");
    if (config.css) for (var prop in config.css) if (config.css.hasOwnProperty(prop))
        $w.css(prop, config.css[prop]);

    if (typeof config.class === typeof "")
        win.className += config.class;
    else if (config.class instanceof Array)
        config.class.forEach(function (e) { $w.addClass(e); });
    
    if (config.icon) {
        var icon = $w.find(".window-icon");
            icon.attr("src", config.icon);
            icon.attr("alt", config.title);
    } else
        $w.find(".window-icon").remove();

    if (config.flags | wf.keepOnTop)
        $w.css("zIndex", 9999);
    
    $w.find(".window-title").text(config.title);
    $w.find(".window-body").html(config.body);
    
    var $h = $w.find(".window-header");
    $h.on("mousedown", function (event) {
        
        win.beginPos = new Vector2D(event.clientX, event.clientY); // mouse position on drag start
        win.beginStyle = new Vector2D(parseFloat(win.getStyle("left")), parseFloat(win.getStyle("top"))); // window offset on drag start
        
    }).on("mousemove", function (event) {
        var prevPos = win.beginPos; // mouse position on drag start

        // if the drag has begun (i.e. win.beginPos has been set)
        if (!isNull(prevPos)) {
            // if the window is maximised...
            if ($w.hasClass("maximised") || $w.hasClass("minimised"))
                // un-maximise it
                $w.toggleClass("maximised", false);

            // instant transition
            $w.css("transition", "0s all");

            // current mouse position
            var currPos = new Vector2D(event.clientX, event.clientY);
            // window offset on drag start
            var prevStyle = win.beginStyle;

            // (to be) current window offset, calculated here
            var currStyle = new Vector2D(
                // drag start offset + difference of start and current cursor positions
                prevStyle.x + currPos.x - prevPos.x,
                prevStyle.y + currPos.y - prevPos.y
            );
            var dims = new Vector2D(
                parseInt(getComputedStyle(win).width),
                parseInt(getComputedStyle(win).height)
            );
            if (config.flags & wf.bound) {
                currStyle.x = Math.min(Math.max(currStyle.x, 0), (window.innerWidth - dims.x));
                currStyle.y = Math.min(Math.max(currStyle.y, 0), (window.innerHeight - dims.y));
            }

            // set the window offset
            win.style.left = currStyle.x + "px";
            win.style.top = currStyle.y + "px";

            // width of the hotzone on the top of the screen
            if (config.flags & wf.maximise) {
                var topsidePadding = 8;
                $w.toggleClass("max-ready", currStyle.y <= topsidePadding);
            }

            if (config.flags & wf.bound) {
                win.style.maxWidth = window.innerWidth - currStyle.x + "px";
                win.style.maxHeight = window.innerHeight - currStyle.y + "px";
            } else {
                win.style.maxWidth = "100%";
                win.style.maxHeight = "100%";
            }

            // mark the window as "moving" (this is so the CSS ::after cursor retention hack works)
            $w.toggleClass("moving", true);
        }

    });
    var mouseup = function (event) {
        // unset the drag start variables (signalling that the drag has stopped)
        win.beginPos = undefined;
        win.beginStyle = undefined;

        // regular smooth transition
        $w.css("transition", "0.2s all");
        // if the window has been marked "ready to maximise"...
        if ($w.hasClass("max-ready") &&
            // and the mouse has deliberately been released
            event.type == "mouseup") {
            // maximise the window
            $w.toggleClass("maximised", true);
        }

        // unset the flagging classes
        $w.toggleClass("max-ready", false);
        $w.toggleClass("moving", false);
    };
    $h.on("mouseup", mouseup).on("mouseleave", mouseup);
    
    if (!(config.flags & wf.resize))
        $w.find(".window-resizer").remove();
    else {
        $w.addClass("resizeable");
        $w.find(".window-resizer")
            .on("mousedown", function (event) {
                var win = $(this).parent();
                this.origWidth = parseInt(getComputedStyle(win[0]).width);
                this.origHeight = parseInt(getComputedStyle(win[0]).height);
                this.origX = event.clientX;
                this.origY = event.clientY;

                win.toggleClass("resizing", true);
                win.css("transition", "0s all");
            }).on("mousemove", function (event) {
                if (!isNull(this.origWidth)) {
                    var win = $(this).parent();
                    win[0].style.width = (event.clientX - this.origX) + this.origWidth + "px";
                    win[0].style.height = (event.clientY - this.origY) + this.origHeight + "px";
                }
            });
        
        mouseup = function () {
            this.origWidth = this.origHeight =
            this.origX = this.origY = null;

            $(this).parent().toggleClass("resizing", false);
            $(this).parent().css("transition", "0.2s all");
        };
        $w.find(".window-resizer")
            .on("mouseup", mouseup)
            .on("mouseleave", mouseup);
    }
    
    var self = this;
    $w.on("mousedown", function (event) {
        if (event.originalEvent.target != $w.find(".window-header-minimise")[0]) {
            self.wm.selectWindow(self);
        }
    });
    
    if (!(config.flags & wf.minimise))
        $w.find(".window-header-minimise").remove();
    else {
        $w.find(".window-header-minimise").click(function () {
            $w.addClass("minimised");
        });
    }
    
    if (!(config.flags & wf.maximise))
        $w.find(".window-header-maximise").remove();
    else {
        $w.find(".window-header-maximise").click(function () {
            $w.toggleClass("maximised");
        });
    }

    self.onClose = config.onClose || function () {};

    self.close = function () {
        self.onClose(self);
        $w.remove();
        delete self.wm.elements[self.id];
    };
    
    $w.find(".window-header-close").bind("click", self.close);

    var s = getComputedStyle(win);
    win.style.left = parseInt(s.left);
    win.style.top = parseInt(s.top);
    win.style.width = parseInt(s.width);
    win.style.height = parseInt(s.height);
    
};
JSWM.Window.prototype = Object.create(JSWM.Element.prototype);
JSWM.Window.prototype.constructor = JSWM.Window;

var dialogTemplate = [
    "<fieldset class='dialog-options'>",
        "<div class='dialog-choices'>",
        "</div>",
    "</fieldset>"
].join("\n");

JSWM.Dialog = function (wm, title, body, config) {
    var df = JSWM.DialogOptions,
        wf = JSWM.WindowFlags,
        self = this;

    config = config || {};
    config.flags = isNull(config.flags)
        ? wf.keepOnTop | wf.bound
        : config.flags;
    config.dialogOptions = config.dialogOptions || (df.ok + df.cancel);
    config.onAccept = config.onAccept || function () {};
    JSWM.Window.call(this, wm, title, body, config);

    var $w = $(this.element);
    $w.find(".window-content").append(dialogTemplate);
    $w.addClass("dialog");

    var choices = $w.find(".dialog-choices")[0];
    if (config.dialogOptions & df.ok) {
        var okButton = document.createElement("button");
            okButton.className = "dialog-choice ok";
            okButton.textContent = "OK";
        choices.appendChild(okButton);

        $(okButton).on("click", function () {
            config.onAccept(self);
            self.close();
        });
    }
    if (config.dialogOptions & df.cancel) {
        var cancelButton = document.createElement("button");
            cancelButton.className = "dialog-choice cancel";
            cancelButton.textContent = "Cancel";
        choices.appendChild(cancelButton);

        $(cancelButton).on("click", self.close);
    }
    if (config.dialogOptions & df.apply) {
        var applyButton = document.createElement("button");
            applyButton.className = "dialog-choice apply";
            applyButton.textContent = "Apply";
        choices.appendChild(applyButton);

        $(applyButton).on("click", function () {
            config.onAccept(self);
        });
    }

};
JSWM.Dialog.prototype = Object.create(JSWM.Window.prototype);
JSWM.Dialog.prototype.constructor = JSWM.Dialog;

function updateObject(original, override) {
    for (var prop in override) if (override.hasOwnProperty(prop)) {
        if (typeof override[prop] == "object" && typeof original[prop] == "object")
            updateObject(original[prop], override[prop]);
        else original[prop] = override[prop];
    }
    return original;
}