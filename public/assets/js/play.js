var ws, canvas,
    myId = null,
    question_id = null,
    gracefulClose = false,
    timeoutInterval = null,
    held = false,
    mode = "draw",
    previousScore = 0,
    choices = [],
    score = 0;

LEGAL_STATE_TRANSITIONS = {
    "default": ["unauthenticated", "pre-game"],
    "unauthenticated": [],
    "pre-game": ["pre-game", "question", "error", "default"],
    "question": ["question", "answer", "timeout", "conclusion", "error", "default"],
    "timeout": ["question", "answer", "error", "default"],
    "answer": ["question", "conclusion", "error", "default"],
    "conclusion": [],
    "error": ["default"]
};

function resetTimeout() {
    clearInterval(timeoutInterval);
    $(".timeout-display").text("00:00.00");
}

function continueHandler() {
    if (!changeState("default")) return;
    ws.reopen();
}

function changeMode(newMode) {
    $(".only.mode-" + mode).removeClass("show");
    $(".only.mode-" + newMode).addClass("show");
    mode = newMode;
}

function submitPaths(paths, callback) {
    var arr = [];
    for (var id in paths) if (paths.hasOwnProperty(id)) {
        arr.push(paths[id].abs_plot);
    }

    var data = {
        "width": $(window).width(),
        "height": $(window).height(),
        "plots": arr
    };
    data = JSON.stringify(data);

    if (question_id !== null) {
        ws.send("response", {
            "question_id": question_id,
            "response_type": "paths",
            "response_data": data
        }, callback);
    }
}

function submitText(text, callback) {
    if (question_id !== null) {
        ws.send("response", {
            "question_id": question_id,
            "response_type": "text",
            "response_data": text
        }, callback);
    }
}

function Path(abs_plot) {
    this.abs_plot = abs_plot;
    this.rel_plot = abs_plot.map(function (point) {
        return [point[0] / $(window).width(),
            point[1] / $(window).height()];
    });

    this.id = generateUUID();
    this.draw = function (canvas) {
        canvas.helper.linePlot(this.abs_plot,
            [this.id, 'path'].join(" "),
            "paths"
        );
        canvas.helper.appendGroup("paths");
    };
}

function DrawingCanvas(svg, parent) {
    if (isNull(parent)) parent = $(svg).parent()[0];
    WideSVG.call(this, svg, parent);

    this.paths = {};
    this.currentPath = [];

    this.commitPath = function () {
        if (this.currentPath === null || this.currentPath.length <= 0)
            return;

        var path = new Path(this.currentPath);
        this.paths[path.id] = path;
        this.currentPath = [];
    };

    this.loop = function (delta) {
        this.helper.clear();

        var self = this;
        for (var id in self.paths) if (self.paths.hasOwnProperty(id)) {
            self.paths[id].draw(self);
        }

        if (this.currentPath !== null) {
            this.helper.linePlot(this.currentPath,
                "current-path path",
                "paths"
            );
            this.helper.appendGroup("paths");
        }

        this.triggerEvent("draw");
    };
}
DrawingCanvas.prototype = Object.create(WideSVG.prototype);
DrawingCanvas.prototype.constructor = DrawingCanvas;

$(function () {
    Require(["assets/js/tblib/loader.js",
        "assets/js/tblib/ui.js",
        "assets/js/jswm2.js"], function () {

        if (!readCookie("webdrawquiz.contestant_sid")) {
            changeState("unauthenticated");
            displayOverlay("unauthenticated");
            return;
        }

        displayOverlay("disconnected");
        ws = new WSManager("webdrawquiz.contestant_sid");
        ws.on('close', function () {
            if (!gracefulClose) {
                if (!changeState("default")) return;
                displayOverlay("disconnected");
                ws.reopen(null, function () {
                    reportError("The connection has been closed prematurely.", null, continueHandler);
                });
            }
        });

        loader.addTask(function (resolve, reject) {
            if (ws.authenticated === true) { resolve(); }
            else if (ws.authenticated === false) { reject("unauthenticated"); }
            else {
                ws.on("authenticated", function () { resolve(); });
                ws.on("unauthenticated", function () { reject("unauthenticated"); });
            }
        }, 10000, "websocket");

        ws.on("authenticated", function () {
            if (!changeState("pre-game")) return;
            displayOverlay("not-started");
        });

        ws.on("unauthenticated", function () {
            if (!changeState("unauthenticated")) return;
            displayOverlay("unauthenticated");
        });

        $(window).on("beforeunload", function () {
            gracefulClose = true;
            ws.close();
        });

        ws.on("message-type.start", function (e, msg) {
            if (!msg.title || !msg.contestant_id) {
                return reportError("Got unexpected response from server (type='start')", null, continueHandler);
            }
            if (!changeState("pre-game")) return;

            myId = msg.contestant_id;
            hideOverlay();
        });
        ws.on("message-type.contestant", function (e, msg) {
            if (!msg.contestant_id || !msg.status)
                return reportError("Got unexpected response from server (type='contestant')", null, continueHandler);
        });
        ws.on("message-type.question", function (e, msg) {
            if (!msg.question_id || !msg.question || msg.timeout === undefined)
                return reportError("Got unexpected response from server (type='question')", null, continueHandler);

            if (!changeState("question")) return;

            hideOverlay();
            if (canvas)
                canvas.paths = {};

            question_id = msg.question_id;
            $(".question-display").text(msg.question.split("^")[0]);

            if (msg.question.indexOf("^") !== -1) {
                // encountered multiple choice question
                // switch to special mode
                changeMode("choice");
                choices = msg.question.split("^")[1].split(/, */);

                $(".choice-response option:not(.choice-default)").remove();
                for (var i=0;i<choices.length;i++) {
                    var choice = choices[i];
                    var element = document.createElement("option");

                    $(element).text(choice);
                    element.setAttribute("value", i.toString());
                    $(".choice-response").append(element);
                }
            } else if (mode === "choice") {
                // switch out of special mode
                changeMode("draw");
            }

            var expiry = new Date(msg.timeout).getTime();

            var interval = setInterval(function () {
                var timeRemaining = Math.max(expiry - new Date().getTime(), 0);
                var minutes = Math.floor(timeRemaining / (1000 * 60));
                var seconds = (timeRemaining / 1000) % 60;
                $(".timeout-display").text(
                    zeroPrefix(minutes, 2)
                    + ":"
                    + zeroPrefix(seconds.toFixed(2), 5));

                if (timeRemaining === 0) {
                    clearInterval(interval);

                    if (!changeState("timeout")) return;
                    displayOverlay("question-timeout");
                } else if (question_id !== msg.question_id) {
                    clearInterval(interval);
                }
            }, 1);
            clearInterval(timeoutInterval);
            timeoutInterval = interval;
        });
        ws.on("message-type.answer", function (e, msg) {
            if (!msg.question_id || !msg.answer || msg.correct === undefined)
                return reportError("Got unexpected response from server (type='answer')", null, continueHandler);

            if (!changeState("answer")) return;

            $(".answer-display").text(msg.answer);

            var score_delta = msg.score - score;
            score = msg.score;
            if (score_delta > 0)
                $(".only.score-gained").addClass("show");
            else
                $(".only.score-gained").removeClass("show");

            $(".score-delta-display").text(score_delta.toString() + " point" + (score_delta == 1 ? "" : "s"));
            $(".score-display").text(score.toString() + " point" + (score == 1 ? "" : "s"));
            resetTimeout();

            if (msg.correct) {
                displayOverlay("answer-correct");
            } else {
                displayOverlay("answer-incorrect");
            }
        });
        ws.on("message-type.conclusion", function (e, msg) {
            if (!msg.winner_id)
                return reportError("Got unexpected response from server (type='conclusion')", null, continueHandler);

            if (!changeState("conclusion")) return;
            resetTimeout();

            if (msg.winner_id == myId) {
                displayOverlay("end-game-win");
            } else {
                displayOverlay("end-game-lose");
            }
        });
        ws.on("message-type.close", function (e, msg) {
            gracefulClose = true;
        });

        ws.open("../api/v1/ws/contestant");
        loader.start();

        $(document).on("pageload", function () {
            canvas = new DrawingCanvas($(".drawing-plane")[0]);
            changeMode("draw");

            function bindToPlane(query, evt, planeEvt) {
                if (isNull(planeEvt)) planeEvt = evt;
                $(query).on(evt, function (event) {
                    canvas.triggerEvent(planeEvt, event);
                });
            }

            bindToPlane(".drawing-plane", "mousedown", "input_start");
            bindToPlane(".drawing-plane", "mousemove", "input_move");
            bindToPlane(".drawing-plane", "mouseup", "input_end");
            bindToPlane(".drawing-plane", "mouseleave", "input_end");
            bindToPlane(".drawing-plane", "touchstart", "input_start");
            bindToPlane(".drawing-plane", "touchmove", "input_move");
            bindToPlane(".drawing-plane", "touchend", "input_end");
            bindToPlane(".drawing-plane", "touchcancel", "input_end");

            function getXY(e) {
                var x, y;
                if (e.changedTouches && e.changedTouches.length > 0) {
                    x = e.changedTouches[0].clientX;
                    y = e.changedTouches[0].clientY;
                } else if (e.clientX && e.clientY) {
                    x = e.clientX;
                    y = e.clientY;
                }

                if (x === undefined || y === undefined)
                    return null;
                else return [x, y];
            }

            function erasePath(target) {
                var uuidRe = /([0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12})/;

                if (!isNull(target) &&
                    target.getAttribute("class").search("path") !== -1)
                {
                    var id = target.getAttribute("class").match(uuidRe)[1];
                    if (canvas.paths[id] !== undefined)
                        delete canvas.paths[id];
                }
            }

            canvas.addEventHandler("input_start", function (plane, e) {
                held = true;
                e.preventDefault();

                if (plane.currentPath === null) return;

                var xy = getXY(e.originalEvent);
                if (!xy) return;
                plane.currentPath.push(xy);
                plane.currentPath.push(xy); // to allow for dots
            });
            canvas.addEventHandler("input_end", function (plane, e) {
                held = false;
                e.preventDefault();
                plane.commitPath();
                submitPaths(canvas.paths);
            });
            canvas.addEventHandler("input_move", function (plane, e) {
                if (!held) return;
                e.preventDefault();

                if (plane.currentPath === null) return;

                var xy = getXY(e.originalEvent);
                if (!xy) return;
                plane.currentPath.push(xy);
            });

            $(".toolbox-eraser").click(function () {
                canvas.paths = {};
            });
            $(".text-response").on("change", function () {
                if (mode === "text") {
                    var text = $(".text-response").val().trim();
                    if (!text) return;
                    submitText(text);
                }
            });
            $(".choice-response").on("change", function () {
                if (mode === "choice") {
                    var selected = choices[$(".choice-response").val()];
                    if (!selected) return;
                    submitText(selected);
                }
            });
            $(".toolbox-change-mode").click(function () {
                switch (mode) {
                    case "draw":
                        changeMode("text");
                        break;
                    case "text":
                        changeMode("draw");
                        break;
                    default:
                        changeMode("draw");
                }
            });
        });
    });
});
