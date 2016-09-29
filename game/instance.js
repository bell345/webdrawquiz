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
    this.currentQuestion = -1;
}

GameInstance.prototype.hostConnect = function (host) {
    this.host = host;
    host.updatePlayers();
};

GameInstance.prototype.contestantConnect = function (contestant) {
    this.contestants.push(contestant);

    if (this.host) this.host.updatePlayers();
};

GameInstance.prototype.startGame = function () {

};
