/**
 * Created by thomas on 2016-09-28 at 13:53.
 *
 * MIT Licensed
 */
var error = require("../error"),
    send = require("../send"),
    parse = require("../parse");

module.exports = function (game) {
    return function (ws, req, next) {
        var handler = parse(function (err, msg) {
            if (err) return next(err);

            if (msg.type == "auth") {
                if (!msg.token)
                    return next(error("bad_request",
                        "Messages of type 'auth' require the token field.", msg));

                game.model.hostAuth(msg.token, function (err, token) {
                    if (err) return next(error("server_error",
                        "There was a problem during authentication.", msg, err));

                    if (!token) return next(error("invalid_client",
                        "The token provided was invalid or has expired."));

                    send(ws, {
                        type: "auth",
                        authenticated: true
                    }, msg);
                    ws.authenticated = req.authenticated = "host";
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