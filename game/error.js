/**
 * Created by thomas on 2016-09-27 at 12:27.
 *
 * MIT Licensed
 */
var util = require("util");

module.exports = GameError;

function GameError(err_spec, description, error) {
    if (!(this instanceof GameError))
        return new GameError(err_spec, description, error);

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

    switch (err_spec) {
        case "invalid_client":
        case "bad_request":
            this.status = 400;
            break;
        case "invalid_token":
            this.status = 401;
            break;
        case "server_error":
            this.status = 503;
            break;
        default:
            this.status = 500;
    }

    this.error = error;
    this.error_type = err_spec;
    this.error_description = description || error;
}

util.inherits(GameError, Error);

GameError.handler = function (game) {
    return function (err, req, res, next) {
        if (!(err instanceof GameError)) return next(err);

        delete err.name;
        delete err.message;

        game.debug(err.stack || err);
        delete err.stack;

        if (err.headers) res.set(err.headers);
        delete err.headers;

        res.status(err.status).send(err);
    }
};