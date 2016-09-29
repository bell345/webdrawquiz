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

WSAPIError.prototype.send = function (ws) {
    debug("Error: ", this.error_type, this.error_description);
    send(ws, {
        type: "error",
        error_type: this.error_type,
        error_description: this.error_description
    }, this.message);
};

WSAPIError.handler = function () {
    return function (err, req, res, next) {
        if (err instanceof WSAPIError)
            err.send(req.ws);
        else next(err);
    }
};

module.exports = WSAPIError;
