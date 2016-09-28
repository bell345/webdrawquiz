/**
 * Created by thomas on 2016-09-28 at 13:39.
 *
 * MIT Licensed
 */
var error = require("./error");

module.exports = function (next) {
    return function (text) {
        var msg = {};
        try {
            msg = JSON.parse(text);
        } catch (e) {
            return next(error("bad_request",
                "Message must be valid JSON."));
        }

        if (msg.type === undefined)
            return next(error("bad_request",
                "Message must have a type field.", msg));

        return next(null, msg);
    };
};