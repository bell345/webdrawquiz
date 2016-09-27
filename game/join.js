/**
 * Created by thomas on 2016-09-27 at 18:42.
 *
 * MIT Licensed
 */
var runner = require("./runner"),
    error = require("./error"),
    generateSessionID = require("./sid");

module.exports = Join;

var fns = [
    validate,
    join
];

function Join(config, req, res, next) {
    if (!(this instanceof Join))
        return new Join(config, req, res, next);

    this.config = config;
    this.model = config.model;
    this.req = req;
    this.res = res;

    runner(fns, this, next);
}

function validate(done) {
    if (this.req.method != "POST")
        return done(error("invalid_request",
            "Only POST method permitted."));

    if (!this.req.is("application/json"))
        return done(error("bad_request",
            "Request is required to be in application/json format."));

    if (!this.req.body.quiz_code || !this.req.body.name)
        return done(error("invalid_client",
            "A quiz code and a contestant name must be provided."));

    this.quiz_code = this.req.body.quiz_code;
    this.name = this.req.body.name;
    done();
}

function join(done) {
    var self = this;

    generateSessionID(function (err, sid) {
        if (err) return done(error("server_error",
            "There was a problem while joining the game.", err));

        self.model.addContestant(self.quiz_code, sid, self.name, function (err, contestant) {
            if (err === "invalid_code") return done(error("invalid_client",
                "Quiz code does not exist."));

            if (err === "name_taken") return done(error("invalid_client",
                "The name has already been taken."));

            if (err || !contestant) return done(error("server_error",
                "There was a problem while joining the game.", err));

            self.res.status(200).send({
                contestant_sid: contestant.sid
            });
        });
    });
}