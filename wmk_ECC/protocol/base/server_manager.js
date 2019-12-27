/**
 * Created by wangxh on 2017/10/12.
 */

'use strict';

var communicator = require('../../util/communication/communicator_json');

function server_manager() {
    this.host = undefined;
    this.port = undefined;

    this.comm = undefined;

    this.connected = undefined;
    this.closed = undefined;
    this.req_received = undefined;
    this.notify_received = undefined;

    var self = this;
    this.GetIsOpened = function () {
        if(self.comm){
            return self.comm.isOpened;
        }else{
            return false;
        }
    }
}

server_manager.prototype.connect = function () {
    var self = this;

    if(self.comm){
        self.comm.close(true);
        self.comm = undefined;
    }

    var comm = new communicator();
    self.comm = comm;

    comm.connected = self.connected;
    comm.closed = self.closed;
    comm.req_received = self.req_received;
    comm.notify_received = self.notify_received;

    comm.connect(self.host, self.port);
};

server_manager.prototype.close = function (destroy) {
    var self = this;
    if(self.comm){
        self.comm.close(destroy);
    }
};

server_manager.prototype.send = function (msg, callback, timeout) {
    this.comm.send(msg, callback, timeout);
};

server_manager.prototype.notify = function (msg) {
    if(!this.GetIsOpened()){
        return false;
    }
    return this.comm.notify(msg);
};

module.exports = server_manager;