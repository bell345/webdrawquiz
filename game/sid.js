/**
 * Created by thomas on 2016-09-27 at 18:47.
 *
 * MIT Licensed
 */
var crypto = require("crypto"),
    error = require("./error");

module.exports = function (callback) {
    crypto.randomBytes(256, function (err, buffer) {
        if (err) return callback(error("server_error"));

        var token = crypto
            .createHash("sha1")
            .update(buffer)
            .digest("hex");

        callback(null, token);
    })
}