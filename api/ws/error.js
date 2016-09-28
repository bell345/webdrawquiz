/**
 * Created by thomas on 2016-09-28 at 13:25.
 *
 * MIT Licensed
 */
var util = require("util"),
    debug = require("debug")("webdrawquiz:wsapi"),
    send = require("./send");

function WSAPIError(spec, description, msg, error) {
    if (!(this instanceof WSAPIError))
        return new WSAPIError(spec, description, msg, error);

    Error.call(this);

    this.name = this.constructor.name;

    if (error instanceof Error) {
        this.message = error.message;
        this.stack = error.stack;
    } else {
        this.message = description;
        Error.captureStackTrace(this, this.constructor);
    }

    this.error = error;
    this.error_type = spec;
    this.error_description = description || error;
    this.message = msg;
}
util.inherits(WSAPIError, Error);

WSAPIError.handler = function () {
    return function (err, req, res, next) {
        debug("Error: ", err.error_type, err.error_description);
        send(req.ws, {
            type: "error",
            error_type: err.error_type,
            error_description: err.error_description
        }, err.message);
    }
};

module.exports = WSAPIError;