/**
 * Created by thomas on 2016-09-27 at 12:24.
 *
 * MIT Licensed
 */
var error = require("./error"),
    debug = require("debug")("webdrawquiz:server"),
    Instance = require("./instance"),
    Join = require("./join"),
    Create = require("./create");

module.exports = GameServer;

function GameServer(config) {
    config = config || {};

    if (!config.model)
        throw new Error("DB model not provided.");

    this.model = config.model;

    this.debug = config.debug ? debug : function () {};

    this.instances = {};
}

GameServer.prototype.create = function () {
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

GameServer.prototype.getInstance = function (quiz_id) {
    for (var id in this.instances) if (this.instances.hasOwnProperty(id)) {
        if (this.instances[id].closed)
            delete this.instances[id];
    }

    if (this.instances[quiz_id] !== undefined)
        return this.instances[quiz_id];

    else {
        var instance = new Instance(this, quiz_id);
        this.debug("New instance created (%s)", quiz_id);
        this.instances[quiz_id] = instance;
        return instance;
    }
};

GameServer.prototype.handler = function () {
    return error.handler(this);
};
