/**
 * Created by thomas on 2016-09-29 at 17:06.
 *
 * MIT Licensed
 */
var error = require("../error"),
    send = require("../send");

module.exports = Host;

function Host(instance, ws, id) {
    this.instance = instance;
    this.model = instance.model;
    this.closed = false;
    this.ws = ws;
    this.id = id;
    this.address = ws.upgradeReq.socket.remoteAddress;
}
Host.prototype.connect = function () {
    var self = this;
    this.instance.hostConnect(this);
    this.instance.debug("Host connected (%s)", this.address);

    if (this.instance.started) {
        send(this.ws, {
            "type": "start",
            "title": this.instance.title
        });

        self.updatePlayers(true);

        var question = this.instance.currentQuestion;
        if (question !== null) {
            this.sendQuestion(question, true);
            if (question.answerSent) {
                send(self.ws, {
                    "type": "answer",
                    "question_id": question.id
                });
            }

            self.model.getResponses(question.id, function (err, responses) {
                if (err) return error("server_error",
                    "An error occurred while retreiving responses.", msg, err)
                    .send(self.ws);

                if (!responses) return;

                responses.forEach(function (response) {
                    self.sendResponse(response);
                });
            });
        }
    }
};
Host.prototype.disconnect = function () {
    this.closed = true;
    this.instance.debug("Host disconnected (%s)", this.address);
};
Host.prototype.broadcast = function (payload, excludeHost) {
    var self = this;

    var contestants = self.instance.contestants
        .filter(function (c) { return !c.closed; });

    var connected = contestants.slice(0);
    if (!this.closed && !excludeHost) connected.push(self);

    connected.forEach(function (c) {
        if (c.closed) return;
        if (payload.send !== undefined)
            payload.send(c.ws);
        else
            send(c.ws, payload);
    });

    self.instance.contestants = contestants;
};
Host.prototype.sendQuestion = function (question, hostOnly) {
    var self = this;
    // To host
    send(this.ws, {
        "type": "question",
        "question_id": question.id,
        "question": question.question,
        "answer": question.answer,
        "timeout": question.timeout,
        "score": question.score
    });

    // To contestants
    if (!hostOnly) this.broadcast({
        "type": "question",
        "question_id": question.id,
        "question": question.question,
        "timeout": question.timeout,
        "score": question.score
    }, true);
};
Host.prototype.sendAnswer = function (question) {
    var self = this;
    if (question.answerSent || this.closed) return;
    question.answerSent = true;
    // To host
    send(self.ws, {
        "type": "answer",
        "question_id": question.id
    });

    var messagesToSend = self.instance.contestants.length;
    self.instance.contestants.forEach(function (contestant) {
        contestant.sendAnswer(question, function (err) {
            messagesToSend--;
            if (err) err.send(contestant.ws);
            if (messagesToSend === 0)
                self.updatePlayers();
        });
    });
};
Host.prototype.sendResponse = function (response) {
    send(this.ws, {
        "type": "response",
        "response_id": response.id,
        "response_type": response.type,
        "response_data": response.data,
        "contestant_id": response.contestant_id,
        "correct": response.correct,
        "bonus": response.bonus
    });
};
Host.prototype.nextQuestion = function (msg, callback) {
    var self = this;
    self.instance.nextQuestion(function (err) {
        if (err) return callback(error("server_error",
            "An error occurred while advancing to the next question.", msg, err));

        return callback(null);
    });
};
Host.prototype.markResponse = function (msg, callback) {
    var self = this;
    if (!msg.response_id)
        return callback(error("bad_request",
            "Message must have a 'response_id' field.", msg));

    if (msg.correct == undefined)
        return callback(error("bad_request",
            "Message must have a 'correct' field.", msg));

    var bonus = 0;
    if (msg.bonus !== undefined) {
        if ((msg.bonus < 0) || (parseInt(msg.bonus) != msg.bonus))
            return callback(error("bad_request",
                "Optional 'bonus' field must be a positive integer.", msg));

        bonus = parseInt(msg.bonus);
    }

    self.model.markResponse(msg.response_id, msg.correct, bonus, function (err, res) {
        if (err) return callback(error("server_error",
            "An error occurred while marking a response.", msg, err));

        if (!res) return callback(error("invalid_client",
            "Response does not exist.", msg));

        self.instance.debug("Response %s was marked %s",
            msg.response_id, msg.correct ? "correct": "incorrect");

        return callback(null);
    });
};
Host.prototype.announceWinner = function (winner_id) {
    this.broadcast({
        "type": "conclusion",
        "winner_id": winner_id
    });
};
Host.prototype.closeGame = function (reason) {
    this.broadcast({
        "type": "close",
        "reason": reason
    });

    this.ws.close();
    this.closed = true;
    this.instance.contestants.forEach(function (contestant) {
        contestant.ws.close();
        contestant.ws.closed = true;
    });
};
Host.prototype.startGame = function (msg, callback) {
    var self = this;

    if (self.instance.started)
        return callback(error("invalid_client",
            "The quiz has already been started.", msg));

    self.instance.startGame(function (err, title) {
        if (err) return callback(error("server_error",
            "An error occurred while starting the game.", msg, err));

        send(self.ws, {
            "type": "start",
            "title": title
        });
        self.instance.contestants.forEach(function (contestant) {
            if (contestant.closed) return;

            send(contestant.ws, {
                "type": "start",
                "title": title,
                "contestant_id": contestant.id
            });
        });

        self.instance.nextQuestion(function (err) {
            if (err) return callback(error("server_error",
                "An error occurred while moving to the first question.", msg, err));

            callback(null, title);
        });
    });
};
Host.prototype.endGame = function (msg, callback) {
    var self = this;
    self.instance.endGame(function (err) {
        if (err) return callback(error("server_error",
            "An error occurred while trying to end the game.", msg, err));

        return callback(null);
    });
};
Host.prototype.updatePlayers = function (hostOnly) {
    var self = this;
    function _send(payload) {
        if (hostOnly) {
            if (payload.send !== undefined)
                payload.send(self.ws);
            else
                send(self.ws, payload);
        } else {
            self.broadcast(payload);
        }
    }

    self.instance.contestants.forEach(function (contestant) {
        if (contestant.closed) {
            _send({
                "type": "contestant",
                "status": "disconnected",
                "contestant_id": contestant.id
            });
        } else {
            contestant.getInfo(function (err, info) {
                if (err) {
                    _send(error("server_error",
                        "There was an error while retreiving contestant info.",
                        null, err));
                } else {
                    _send({
                        "type": "contestant",
                        "status": "connected",
                        "contestant_id": contestant.id,
                        "contestant_name": info.name,
                        "score": info.score
                    });
                }
            });
        }
    });
};
