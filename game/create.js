/**
 * Created by thomas on 2016-09-27 at 18:52.
 *
 * MIT Licensed
 */
var runner = require("./runner"),
    error = require("./error"),
    generateSessionID = require("./sid");

module.exports = Create;

var fns = [
    validate,
    create
];

function Create(config, req, res, next) {
    if (!(this instanceof Create))
        return new Create(config, req, res, next);

    this.config = config;
    this.model = config.model;
    this.req = req;
    this.res = res;

    runner(fns, this, next);
}

function validate(done) {
    if (!this.req.is("application/json"))
        return done(error("bad_request",
            "Request is required to be in application/json format."));

    if (!this.req.body["title"])
        return done(error("invalid_client",
            "A title must be provided."));

    var qs = this.req.body["questions"];
    if (!qs || !(qs instanceof Array) || qs.length < 1)
        return done(error("invalid_client",
            "At least one question must be provided."));

    for (var i=0;i<qs.length;i++) {
        var question = qs[i];
        if (!question["question"] || !question["answer"] || !question["time_limit"] || !question["score"])
            return done(error("invalid_client",
                "Each question must have a 'question', 'answer', 'time_limit' and 'score'."));

        if (isNaN(parseInt(question["time_limit"])) || question["time_limit"] <= 0)
            return done(error("invalid_client",
                "The time limit must be a positive integer for each question."));

        if (isNaN(parseInt(question["score"])) || question["score"] <= 0)
            return done(error("invalid_client",
                "The score must be a positive integer for each question."));
    }

    this.title = this.req.body["title"];
    this.questions = this.req.body["questions"];
    done();
}

function create(done) {
    var self = this;

    self.model.getNewQuizCode(function (err, code) {
        if (err) return done(error("server_error",
            "There was a problem while creating a new quiz.", err));

        generateSessionID(function (err, host_sid) {
            if (err) return done(error("server_error",
                "There was a problem while creating a new quiz.", err));

            self.model.createGame(self.title, code, self.questions, host_sid, function (err, quiz) {
                if (err) return done(error("server_error",
                    "There was a problem while creating a new quiz.", err));

                self.res.status(200).send({
                    host_sid: quiz.host_sid,
                    quiz_code: quiz.code
                });
            });
        });
    });
}