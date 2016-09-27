/**
 * Created by thomas on 2016-09-27 at 11:36.
 *
 * MIT Licensed
 */
var error = require("./error"),
    express = require("express");

module.exports = function (game) {
    var router = express.Router();

    router.post("/create", game.create());
    router.post("/join", game.join());

    router.use(function (req, res, next) {
        return next(error("not_found",
            "The requested API endpoint was not found."));
    });

    return router;
};

module.exports.handler = error.handler;