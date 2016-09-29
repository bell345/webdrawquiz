/**
 * Created by thomas on 2016-09-28 at 13:18.
 *
 * MIT Licensed
 */
var error = require("./error"),
    hostAuth = require("./host/auth"),
    contestantAuth = require("./contestant/auth"),
    parse = require("./parse"),
    send = require("./send"),
    printf = require("printf"),
    express = require("express"),
    ws = require("express-ws");

function wscallback(func) {
    return function (ws, req, next) {
        ws.on("message", parse(function (err, msg) {
            if (err) return next(err);

            func(ws, req, msg, next);
        }));
    }
}

function passError(next) {
    return function (err) {
        if (err) return next(err);
    };
}

module.exports = function (server, prefix, game) {
    var router = ws(express.Router(), server).app;

    router.ws(prefix + '/host', hostAuth(game),
    wscallback(function (ws, req, msg, next) {
        switch (msg.type) {
            case "start":
                ws.host.startGame(msg, passError(next));
                break;
            case "question":
                ws.host.nextQuestion(msg, passError(next));
                break;
            case "evaluate":
                ws.host.markResponse(msg, passError(next));
                break;
            case "answer":
                ws.host.sendAnswer(ws.host.instance.currentQuestion);
                break;
            case "conclusion":
                ws.host.endGame(msg, passError(next));
                break;
            default:
                return next(error("not_found",
                    printf("The requested message type '%s' was unhandled.",
                        msg.type), msg));
        }
    }));

    router.ws(prefix + '/contestant', contestantAuth(game),
    wscallback(function (ws, req, msg, next) {
        switch (msg.type) {
            case "response":
                ws.contestant.submitResponse(msg, passError(next));
                break;
            default:
                return next(error("not_found",
                    printf("The requested message type '%s' was unhandled.",
                        msg.type), msg));
        }
    }));

    router.use(error.handler());

    return router;
};
