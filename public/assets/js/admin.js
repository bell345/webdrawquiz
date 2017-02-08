var wm, ws, question_id, timeoutInterval, contestants = {}, gracefulClose = false;

LEGAL_STATE_TRANSITIONS = {
    "default": ["unauthenticated", "pre-game"],
    "unauthenticated": [],
    "pre-game": ["pre-game", "question", "error", "default"],
    "question": ["question", "answer", "conclusion", "error", "default"],
    "answer": ["question", "conclusion", "error", "default"],
    "conclusion": [],
    "error": ["default"]
};

function startQuiz() {
    ws.send("start", {});
}

function endQuiz() {
    ws.send("conclusion", {});
}

function markResponse(response_id, is_correct, bonus) {
    ws.send("evaluate", {
        "response_id": response_id,
        "correct": is_correct,
        "bonus": bonus
    });
}

function showAnswer() {
    ws.send("answer", {});
}

function nextQuestion() {
    ws.send("question", {});
}

function updatePlayers() {
    var names = [];
    for (var prop in contestants) if (contestants.hasOwnProperty(prop)) {
        var c = contestants[prop];
        if (c.status === "connected" && c.contestant_name)
            names.push(c.contestant_name);
    }

    $(".players-display").text(names.join(", "));
}

function zeroPrefix(s, n, c) {
    s = s.toString();
    c = c || '0';
    return (new Array(n - s.length + 1)).join(c) + s;
}

function continueHandler() {
    if (!changeState("default")) return;
    ws.reopen();
}

$(function () {
    Require(["assets/js/tblib/loader.js",
        "assets/js/tblib/ui.js",
        "assets/js/jswm2.js"], function () {

        if (!readCookie("webdrawquiz.host_sid")) {
            changeState("unauthenticated");
            return;
        }

        ws = new WSManager("webdrawquiz.host_sid");
        ws.on('close', function () {
            if (!gracefulClose) {
                if (!changeState("default")) return;
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

        $(window).on("beforeunload", function () {
            gracefulClose = true;
            ws.close();
        });

        ws.on("authenticated", function (e, msg) {
            changeState("pre-game");
        });

        ws.on("unauthenticated", function (e, msg) {
            changeState("unauthenticated");
        });

        ws.on("message-type.start", function (e, msg) {
            if (!msg.title) {
                return reportError("Got unexpected response from server (type='start')", null, continueHandler);
            }
            if (!changeState("pre-game")) return;

            $(".quiz-title").text(msg.title);
        });
        ws.on("message-type.close", function (e, msg) {
            gracefulClose = true;
        });

        ws.on("message-type.question", function (e, msg) {
            if (!msg.question || !msg.question_id || !msg.answer) {
                return reportError("Got unexpected response from server (type='question')", null, continueHandler);
            }

            if (!changeState("question")) return;

            question_id = msg.question_id;
            $(".quiz-question-display").text(msg.question);
            $(".quiz-answer-display").text(msg.answer);
            $(".quiz-responses tbody tr:not(.template)").remove();

            var expiry = new Date(msg.timeout).getTime();
            var interval = setInterval(function () {
                var timeRemaining = Math.max(expiry - new Date().getTime(), 0);
                var minutes = Math.floor(timeRemaining / (1000 * 60));
                var seconds = (timeRemaining / 1000) % 60;
                $(".timeout-display").text(
                    zeroPrefix(minutes, 2) +
                    ":" +
                    zeroPrefix(seconds.toFixed(2), 5));

                if (timeRemaining === 0) {
                    clearInterval(interval);
                } else if (question_id !== msg.question_id) {
                    clearInterval(interval);
                }
            }, 1);
            clearInterval(timeoutInterval);
            timeoutInterval = interval;
        });

        ws.on("message-type.answer", function (e, msg) {
            changeState("answer");
            clearInterval(timeoutInterval);
            $(".timeout-display").text("00:00.00");
        });

        ws.on("message-type.contestant", function (e, msg) {
            var id = msg.contestant_id;
            if (!contestants[id])
                contestants[id] = {};

            for (var prop in msg) if (msg.hasOwnProperty(prop)) {
                contestants[id][prop] = msg[prop];
            }
            updatePlayers();
        });

        ws.on("message-type.response", function (e, msg) {
            if (!msg.response_id || !msg.response_type || !msg.response_data || !msg.contestant_id)
                return reportError("Got unexpected response from server (type='response')", null, continueHandler);

            var row = $(".quiz-responses tbody tr.template")[0].cloneNode(true);
            $(row).removeClass("template");
            $(".quiz-responses tbody").append(row);

            var contestant = contestants[msg.contestant_id];
            if (contestant === undefined)
                return reportError("Contestant ID is invalid (type='response')");

            $(".quiz-responses tbody .contestant-name").filter(function (i, e) {
                return $(e).text() === contestant.contestant_name;
            }).parents("tr").remove();

            $(row).find(".contestant-name").text(contestant.contestant_name);

            function updateResponse() {
                var row = $(this).parents("tr");
                markResponse(msg.response_id,
                    row.find(".contestant-correct")[0].checked,
                    row.find(".contestant-bonus").val());
            }

            if (msg.correct)
                $(row).find(".contestant-correct").click();

            $(row).find(".contestant-correct").on('change', updateResponse);

            if (msg.bonus)
                $(row).find(".contestant-bonus").val(msg.bonus);

            $(row).find(".contestant-bonus").on("change", updateResponse);

            switch (msg.response_type) {
                case "text":
                    var span = document.createElement("span");
                    span.className = "response-text-display";
                    span.innerText = msg.response_data;
                    $(row).find(".contestant-response-container").append(span);
                    break;

                case "paths":
                    var data;
                    try {
                        data = JSON.parse(msg.response_data);
                    } catch (e) {
                        reportError("Contestant response failed to parse.", e, continueHandler);
                    }

                    if (!data.width || !data.height || !data.plots)
                        reportError("Got unexpected response (id='"
                            + msg.response_id
                            + "') from contestant (name='"
                            + contestant.name
                            + "')", null, continueHandler);

                    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.setAttribute("viewBox", [0, 0, data.width, data.height].join(" "));
                    svg.setAttribute("class", "response-paths-display");
                    $(row).find(".contestant-response-container").append(svg);

                    var helper = new SVGHelper(svg);
                    data.plots.forEach(function (plot) {
                        helper.linePlot(plot, "response-path");
                    });
                    break;

                default:
                    reportError("Got unexpected response type (type='"
                        + msg.response_type
                        + "')", null, continueHandler);
            }

        });

        ws.on("message-type.conclusion", function (e, msg) {
            if (!msg.winner_id)
                return reportError("Got unexpected response from server (type='conclusion')", null, continueHandler);

            if (!changeState("conclusion")) return;

            var winner = contestants[msg.winner_id];
            if (!winner || winner.status !== "connected") {
                winner = null;
                for (var prop in contestants) if (contestants.hasOwnProperty(prop)) {
                    var c = contestants[prop];
                    if ((!winner || c.score > winner.score) && c.status === "connected")
                        winner = c;
                }
            }

            $(".winner-display").text(winner ? winner.contestant_name : "unknown");
        });

        ws.open("../api/v1/ws/host");
        loader.start();

        $(document).on("pageload", function () {
            $(".quiz-code-display").text(
                readCookie("webdrawquiz.quiz_code"));

            $(".start-quiz").click(function () { startQuiz(); });
            $(".end-quiz").click(function () { endQuiz(); });
            $(".show-answer").click(function () { showAnswer(); });
            $(".next-question").click(function () { nextQuestion(); });
        });
    });
});
