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

module.exports = function (server, prefix, game) {
    var router = ws(express.Router(), server).app;

    router.ws(prefix + '/host', hostAuth(game),
    wscallback(function (ws, req, msg, next) {
        switch (msg.type) {
            default:
                return next(error("not_found",
                    printf("The requested message type '%s' was unhandled.",
                        msg.type), msg));
        }
    }));

    router.ws(prefix + '/contestant', contestantAuth(game),
    wscallback(function (ws, req, msg, next) {
        switch (msg.type) {
            default:
                return next(error("not_found",
                    printf("The requested message type '%s' was unhandled.",
                        msg.type), msg));
        }
    }));

    router.use(error.handler());

    return router;
};
