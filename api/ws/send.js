/**
 * Created by thomas on 2016-09-28 at 13:32.
 *
 * MIT Licensed
 */
var debug = require("debug")("webdrawquiz:wsapi");
module.exports = function (ws, payload, msg) {
    if (typeof payload === "object") {
        if (msg && msg.id)
            payload.id = msg.id;

        if (msg && msg.type && !payload.type)
            payload.type = msg.type;

        payload = JSON.stringify(payload);
    }

    try {
        ws.send(payload, function (err) {
            if (err) debug("WebSocket API error:", err);

            //debug("TX msg: " + payload);
        });
    } catch (e) {
        debug("Message couldn't send: %s", e);
    }
};
