/**
 * Created by wangxh on 2017/10/12.
 */

'use strict';

var net = require('net');
var logger = require('../../util/log_manager').logger;
var communicator_json = require('../../util/communication/communicator_json');

function client_manager() {
    this.connectionId = 0;
    this.server = undefined;

    this.comm_connected = undefined;
}

client_manager.prototype.listen = function (port) {
    var self = this;

    if(self.server != undefined){
        return;
    }
    var server = net.createServer(function(socket) {
        var comm = new communicator_json();
        comm.as_data_pipe(socket);
        comm._id = (++self.connectionId);
        logger.info('new data prot(id:%s, %s:%s) connected, ', comm._id, comm.host, comm.port);

        if(self.comm_connected != undefined){
            self.comm_connected(comm);
        }
    });
    server.listen(port, function() {
        logger.info('start listen on: ', port);
    });
    this.server = this;
};

module.exports = client_manager;