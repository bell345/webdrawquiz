/**
 * Created by thomas on 2016-09-27 at 11:36.
 *
 * MIT Licensed
 */
var error = require("./error"),
    create = require("./create"),
    join = require("./join"),
    express = require("express");

module.exports = function (db) {
    var router = express.Router();

    router.use("/create", create(db));
    router.use("/join", join(db));

    router.use(function (req, res, next) {
        return next(error("not_found",
            "The requested API endpoint was not found."));
    });

    return router;
};

module.exports.handler = error.handler;