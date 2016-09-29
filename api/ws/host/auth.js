/**
 * Created by thomas on 2016-09-28 at 13:53.
 *
 * MIT Licensed
 */
var error = require("../error"),
    send = require("../send"),
    Host = require("./host"),
    parse = require("../parse");

module.exports = function (game) {
    return function (ws, req, next) {
        var closeHandler = function () {
            ws.host.disconnect();
            delete ws.host;
        };
        var handler = parse(function (err, msg) {
            if (err) return next(err);

            if (msg.type == "auth") {
                if (!msg.token)
                    return next(error("bad_request",
                        "Messages of type 'auth' require the token field.", msg));

                game.model.hostAuth(msg.token, function (err, quiz_id) {
                    if (err) return next(error("server_error",
                        "There was a problem during authentication.", msg, err));

                    if (!quiz_id) return next(error("invalid_client",
                        "The token provided was invalid or has expired."));

                    send(ws, {
                        type: "auth",
                        authenticated: true
                    }, msg);
                    ws.authenticated = req.authenticated = "host";
                    ws.token = msg.token;

                    var instance = game.getInstance(quiz_id);
                    ws.host = new Host(
                        instance, ws, quiz_id
                    );
                    instance.hostConnect(ws.host);
                    ws.removeListener("message", handler);
                    ws.on('close', closeHandler);

                    next();
                });
            } else return next(error("forbidden",
                "To access the WebSocket API, authentication is required. " +
                "Please send a message with an 'auth' type.", msg));
        });
        ws.on("message", handler);
    }
};
