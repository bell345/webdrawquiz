/**
 * Created by thomas on 2016-09-27 at 11:40.
 *
 * MIT Licensed
 */
var util = require("util");

function APIError(spec, description, error) {
    if (!(this instanceof APIError))
        return new APIError(spec, description, error);

    Error.call(this);

    this.name = this.constructor.name;

    if (error instanceof Error) {
        this.message = error.message;
        this.stack = error.stack;
    } else {
        this.message = description;
        Error.captureStackTrace(this, this.constructor);
    }

    this.headers = {
        "Cache-Control": "no-store",
        "Pragma": "no-cache"
    };

    switch (spec) {
        case "invalid_client":
        case "invalid_request":
            this.status = 400;
            break;
        case "not_found":
            this.status = 404;
            break;
        case "server_error":
            this.status = 503;
            break;
        default:
            this.status = 500;
    }

    this.error = error;
    this.error_type = spec;
    this.error_description = description || error;
}
util.inherits(APIError, Error);

module.exports = APIError;

module.exports.handler = function () {
    return function (err, req, res, next) {
        if (!(err instanceof APIError)) return next(err);

        delete err.name;
        delete err.message;

        delete err.stack;

        if (err.headers) res.set(err.headers);
        delete err.headers;

        res.status(err.status).send(err);
    }
}