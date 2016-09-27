/**
 * Created by thomas on 2016-09-27 at 12:24.
 *
 * MIT Licensed
 */
var error = require("./error"),
    Join = require("./join"),
    Create = require("./create");

module.exports = GameServer;

function GameServer(config) {
    config = config || {};

    if (!config.model)
        throw new Error("DB model not provided.");

    this.model = config.model;

    this.debug = config.debug ? function (l) { console.log(l); } : function () {};
}

GameServer.prototype.create = function (title, questions, callback) {
    var self = this;
    return function (req, res, next) {
        return new Create(self, req, res, next);
    }
};

GameServer.prototype.join = function () {
    var self = this;
    return function (req, res, next) {
        return new Join(self, req, res, next);
    }
};

GameServer.prototype.handler = function () {
    return error.handler(this);
};