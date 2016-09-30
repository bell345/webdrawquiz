/**
 * Created by thomas on 2016-09-29 at 17:06.
 *
 * MIT Licensed
 */
var error = require("../error"),
    send = require("../send");

module.exports = Contestant;

function Contestant(instance, ws, quiz_id, id) {
    this.instance = instance;
    this.model = instance.model;
    this.ws = ws;
    this.quiz_id = quiz_id;
    this.id = id;
    this.closed = false;
    this.address = ws.upgradeReq.socket.remoteAddress;
}
Contestant.prototype.getInfo = function (callback) {
    return this.model.getContestantInfo(this.id, callback);
};
Contestant.prototype.connect = function () {
    this.instance.contestantConnect(this);
    this.instance.debug("Contestant %s connected (%s)", this.id, this.address);

    if (this.instance.started) {
        send(this.ws, {
            "type": "start",
            "title": this.instance.title,
            "contestant_id": this.id
        });

        if (this.instance.currentQuestion != null) {
            var question = this.instance.currentQuestion;

            send(this.ws, {
                "type": "question",
                "question_id": question.id,
                "question": question.question,
                "timeout": question.timeout,
                "score": question.score
            });

            var self = this;
            if (question.answerSent) {
                this.sendAnswer(question, function (err) {
                    if (err && err.send) err.send(self.ws);
                }, true);
            }
        }
    }
};
Contestant.prototype.disconnect = function () {
    this.closed = true;
    if (this.instance.host)
        this.instance.host.updatePlayers();
    this.instance.debug("Contestant %s disconnected (%s)", this.id, this.address);
};
Contestant.prototype.submitResponse = function (msg, callback) {
    var self = this;
    if (!msg.question_id)
        return callback(error("bad_request",
            "Message must have a 'question_id' field.", msg));

    if (!msg.response_type)
        return callback(error("bad_request",
            "Message must have a 'response_type' field.", msg));

    if (!msg.response_data)
        return callback(error("bad_request",
            "Message must have a 'response_data' field.", msg));

    if (self.instance.currentQuestion === null)
        return callback(error("invalid_question",
            "The quiz is not currently running any questions.", msg));

    if (self.instance.currentQuestion.id != msg.question_id)
        return callback(error("invalid_question",
            "The current question is not the one that the response was sent for.", msg));

    if (self.instance.currentQuestion.timeout <= new Date().getTime())
        return callback(error("invalid_question",
            "The current question is no longer accepting entries."));

    self.model.submitResponse(msg.question_id, self.id, msg.response_type, msg.response_data, function (err, response) {
        if (err) return callback(error("server_error",
            "An error occurred while submitting a response.", msg, err));

        if (self.instance.host) {
            self.instance.host.sendResponse(response);

            self.instance.debug("Contestant %s submitted response %s", self.id, response.id);
            callback(null);
        }
    });
};
Contestant.prototype.sendAnswer = function (question, callback, noSideEffects) {
    if (this.closed) return callback(null);

    var self = this;
    self.model.isCorrect(self.id, question.id, function (err, isCorrect) {
        if (err) return callback(error("server_error",
            "An error occurred while checking your answer.", null, err));

        var score_delta = question.score;
        if (!isCorrect || noSideEffects) score_delta = 0;

        self.model.increaseScore(self.id, score_delta, function (err, score) {
            if (err) return callback(error("server_error",
                "An error occurred while changing your score.", null, err));

            send(self.ws, {
                "type": "answer",
                "question_id": question.id,
                "question": question.question,
                "answer": question.answer,
                "correct": isCorrect,
                "score": score
            });

            return callback(null);
        });
    });
};
