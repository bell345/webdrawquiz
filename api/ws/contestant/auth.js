/**
 * Created by thomas on 2016-09-28 at 14:05.
 *
 * MIT Licensed
 */
var error = require("../error"),
    send = require("../send"),
    Contestant = require("./contestant"),
    parse = require("../parse");

module.exports = function (game) {
    return function (ws, req, next) {
        var closeHandler = function () {
            ws.contestant.disconnect();
            delete ws.contestant;
        };
        var handler = parse(function (err, msg) {
            if (err) return next(err);

            if (msg.type == "auth") {
                if (!msg.token)
                    return next(error("bad_request",
                        "Messages of type 'auth' require the token field.", msg));

                game.model.contestantAuth(msg.token, function (err, contestant_id, quiz_id) {
                    if (err) return next(error("server_error",
                        "There was a problem during authentication.", msg, err));

                    send(ws, {
                        type: "auth",
                        authenticated: Boolean(contestant_id)
                    }, msg);

                    if (!contestant_id) return next(error("invalid_client",
                        "The token provided was invalid or has expired."));

                    ws.authenticated = req.authenticated = "contestant";
                    ws.token = msg.token;

                    var instance = game.getInstance(quiz_id);
                    ws.contestant = new Contestant(instance, ws, quiz_id, contestant_id);
                    ws.contestant.connect();
                    ws.on('close', closeHandler);

                    ws.removeListener("message", handler);

                    next();
                });
            } else return next(error("forbidden",
                "To access the WebSocket API, authentication is required. " +
                "Please send a message with an 'auth' type.", msg));
        });
        ws.on("message", handler);
    }
};
