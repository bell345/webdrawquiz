/**
 * Created by thomas on 2016-09-27 at 12:16.
 *
 * MIT Licensed
 */
var error = require("./error"),
    express = require("express");

module.exports = function (db) {
    var router = express.Router();

    router.post("/", function (req, res, next) {
        if (!req.is("application/json"))
            return next(error("bad_request",
                "Request is required to be in application/json format."));

        if (!req.body["quiz_code"] || !req.body["name"])
            return next(error("invalid_client",
                "A quiz code and a contestant name must be provided."));

        db.joinGame(req.body, function (err, ret) {
            if (err) return next(err);

            res.status(200).json(ret);
        });
    });

    return router;
};