/**
 * Created by thomas on 2016-09-29 at 17:00.
 *
 * MIT Licensed
 */

var error = require("./error"),
    debug_ = require("debug");

module.exports = GameInstance;

function GameInstance(gserver, id) {
    this.server = gserver;
    this.model = gserver.model;
    this.host = null;
    this.contestants = [];
    this.id = id;
    this.debug = gserver.debug
        ? debug_("webdrawquiz:game:" + id)
        : function () {};

    this.questions = [];
    this.title = null;
    this._questionIndex = -1;
    this.currentQuestion = null;
    this.started = false;
    this.ended = false;
}

GameInstance.prototype.hostConnect = function (host) {
    this.host = host;
    host.updatePlayers();
};

GameInstance.prototype.contestantConnect = function (contestant) {
    this.contestants.push(contestant);

    if (this.host) this.host.updatePlayers();
};

GameInstance.prototype.nextQuestion = function (callback) {
    this._questionIndex++;
    if (this._questionIndex >= this.questions.length) {
        this.endGame(callback);
    } else {
        this.currentQuestion = this.questions[this._questionIndex];
        this.currentQuestion.answerSent = false;
        this.currentQuestion.timeout =
            (new Date().getTime())
            + (this.currentQuestion.time_limit * 1000);

        this.debug("Next question (%s): %s",
            this.currentQuestion.id,
            this.currentQuestion.question);

        this.host.sendQuestion(this.currentQuestion);
        callback(null, this.currentQuestion);
    }
};

GameInstance.prototype.endGame = function (callback) {
    var self = this;

    self.started = false;
    self.ended = true;
    self.currentQuestion = null;
    self.model.getWinnerID(self.id, function (err, contestant_id) {
        if (err) return callback(err);

        self.debug("Game over: The winner is %s.", contestant_id);
        self.host.announceWinner(contestant_id);
        self.host.closeGame("There are no more questions to answer.");

        setTimeout(function () {
            self.model.endGame(self.id, callback);
        }, 5000);
    });
};

GameInstance.prototype.startGame = function (callback) {
    var self = this;
    self.model.getTitle(self.id, function (err, title) {
        if (err) return callback(err);

        self.model.getQuestions(self.id, function (err, questions) {
            if (err) return callback(err);

            self.questions = questions;
            self._questionIndex = -1;
            self.started = true;
            self.title = title;
            return callback(null, title);
        });
    });
};
