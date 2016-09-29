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

    this.instance.debug("Contestant connected (%s)", this.address);
}
Contestant.prototype.getInfo = function (callback) {
    return this.model.getContestantInfo(this.id, callback);
};
Contestant.prototype.disconnect = function () {
    this.closed = true;
    if (this.instance.host)
        this.instance.host.updatePlayers();
    this.instance.debug("Contestant disconnected (%s)", this.address);
};
