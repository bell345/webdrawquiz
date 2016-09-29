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

    this.instance.debug("Host connected (%s)", this.address);
}
Host.prototype.disconnect = function () {
    this.closed = true;
    this.instance.debug("Host disconnected (%s)", this.address);
};
Host.prototype.updatePlayers = function () {
    var self = this;

    var contestants = self.instance.contestants
        .filter(function (c) { return !c.closed; });

    var connected = contestants.slice(0);
    if (!this.closed) connected.push(self);

    self.instance.contestants.forEach(function (contestant) {
        if (contestant.closed) {
            connected.forEach(function (c) {
                if (c.closed) return;
                send(c.ws, {
                    "type": "contestant",
                    "status": "disconnected",
                    "contestant_id": contestant.id
                });
            });
        } else {
            contestant.getInfo(function (err, info) {
                var msg;
                if (err) {
                    msg = error("server_error",
                        "There was an error while retreiving contestant info.",
                        null, err);

                    connected.forEach(function (c) {
                        if (c.closed) return;
                        msg.send(c.ws);
                    });
                } else {
                    msg = {
                        "type": "contestant",
                        "status": "connected",
                        "contestant_id": contestant.id,
                        "contestant_name": info.name,
                        "score": info.score
                    };

                    connected.forEach(function (c) {
                        if (c.closed) return;
                        send(c.ws, msg);
                    });
                }
            });
        }
    });

    self.instance.contestants = contestants;
};
