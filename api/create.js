/**
 * Created by thomas on 2016-09-27 at 11:45.
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

        if (!req.body["title"])
            return next(error("invalid_client",
                "A title must be provided."));

        if (!req.body["questions"] || !(req instanceof Array) || req.body["questions"].length < 1)
            return next(error("invalid_client",
                "At least one question must be provided."));

        for (var i=0;i<req.body["questions"];i++) {
            var question = req.body["questions"][i];
            if (!question["question"] || !question["answer"] || !question["time_limit"] || !question["score"])
                return next(error("invalid_client",
                    "Each question must have a 'question', 'answer', 'time_limit' and 'score'."));

            if (parseInt(question["time_limit"]) !== question["time_limit"] || question["time_limit"] <= 0)
                return next(error("invalid_client",
                    "The time limit must be a positive integer for each question."));

            if (parseInt(question["score"]) !== question["score"] || question["score"] <= 0)
                return next(error("invalid_client",
                    "The score must be a positive integer for each question."));
        }

        db.createGame(req.body, function (err, ret) {
            if (err) return next(err);

            res.status(200).json(ret);
        });
    });

    return router;
};