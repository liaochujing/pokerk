/**
 * Created by wangxh on 2017/5/31.
 */

'use strict';

var util = require('util');
var net = require('net');
var def = require('../../definition/constants');
var _logger = require('../../util/log_manager');
var logger = _logger.logger;
var stateLog = _logger.stateLog;
var SocketBuffers = require('./socket_buffer');

const head_length = 4;
var _msg_id = 0;

function gen_msg_id() {
    _msg_id++;
    if(_msg_id === def.MAX_INT32){
        _msg_id = 0;
    }
    return _msg_id;
}

function communicator_json() {
    var self = this;

    self.isOpened = false;
    self.send_time_out = 60 * 1000;
    self.reconnect_interval = 2 * 1000;
    self.closed = undefined;
    self.connected = undefined;
    self.req_received = undefined;
    self.notify_received = undefined;
    self.msg_dic = {};

    var hbd = new SocketBuffers(head_length, self.read_body_length);
    hbd.on('packet', function (packet) {
        var body = undefined;
        var msg = undefined;
        try{
            body = packet.slice(4).toString();
            msg = JSON.parse(body);
        }catch(err){
            self.close();
            logger.error({msg: 'socket json parse packet failed', body: body, err: err});
            stateLog.error('[JSON:(%s:%s)][通讯协议错误,断开连接][%s]', self.host, self.port, body);
            return;
        }
        if(msg){
            try{
                if(msg.msgId){
                    if(msg.status == undefined){
                        if(self.req_received){
                            self.req_received(msg, function (res) {
                                self.notify(res);
                            });
                        }else{
                            logger.info('socket json try handle req handler delegate not found');
                        }
                    }else{
                        var cache = self.msg_dic[msg.msgId];
                        if(cache){
                            if(!msg.has_more_data){
                                delete self.msg_dic[msg.msgId];
                            }else{
                                //更新时间
                                if(self.msg_dic[msg.msgId]){
                                    self.msg_dic[msg.msgId].time = Date.now();
                                }
                            }
                            cache.callback(undefined, msg);
                        }else{
                            logger.info('socket json try handle msg callback msgId:%s not found', msg.msgId);
                        }
                    }
                }else{
                    if(self.notify_received){
                        self.notify_received(msg);
                    }
                }
            }catch(err){
                logger.error({msg: 'socket json try handle packet failed', body: body, err: err});
            }
        }
    });
    self.buffer = hbd;
}

communicator_json.prototype.connect = function (host, port) {
    if(host != undefined){
        this.host = host;
    }
    if(port != undefined){
        this.port = port;
    }
    if(!this.host || this.port <= 0 || this.port > 65535){
        logger.info('try connect to (host: %s, port: %s) failed, host or port error', this.host, this.port);
        return;
    }
    
    var self = this;
    self.isOpened = false;

    var socket = new net.Socket();
    this.client = socket;

    socket.on('connect', function () {
        logger.info('socket json(host: %s, port: %s) connected', self.host, self.port);
        self.clear_connect_timeout();
        self.buffer.clear();
        try{
            self.isOpened = true;
            if(self.connected){
                self.connected();
            }
        }catch(err){
            logger.error({msg: 'socket json handle collected failed', err: err});
        }
    });
    socket.on('close', function() {
        logger.warn('socket json(host: %s, port: %s) connection closed', self.host, self.port);

        self._closed();
    });
    socket.on('data', function(data) {
        logger.debug('socket json(host: %s, port: %s) receive data', self.host, self.port);
        
        self.buffer.add_buffer(data);
    });
    socket.on('error', function(err) {
        logger.error('socket json(host: %s, port: %s) connection error', self.host, self.port, err.message);
        self.close();
    });
    socket.on('timeout', function () {
        logger.warn('socket json(host: %s, port: %s) connection time out', self.host, self.port);
        self.close();
    });

    logger.info('try connect to (host: %s, port: %s)', self.host, self.port);

    self.check_connect_timeout();
    socket.connect({host: self.host, port: self.port});
};

communicator_json.prototype.as_data_pipe = function (socket) {
    var self = this;

    self.isDataPipe = true;
    self.isOpened = true;
    self.host = socket.remoteAddress;
    self.port = socket.remotePort;

    socket.setTimeout(0);
    socket.setNoDelay(true);

    this.client = socket;

    socket.on('close', function() {
        logger.warn('socket json(host: %s, port: %s) connection closed', self.host, self.port);

        self._closed();
    });
    socket.on('data', function(data) {
        logger.debug('socket json(host: %s, port: %s) receive data', self.host, self.port);

        self.buffer.add_buffer(data);
    });
    socket.on('error', function(err) {
        logger.error('socket json(host: %s, port: %s) connection error', self.host, self.port, err.message);
        self.close();
    });
    socket.on('timeout', function () {
        logger.warn('socket json(host: %s, port: %s) connection time out', self.host, self.port);
        self.close();
    });
};

communicator_json.prototype.check_connect_timeout = function () {
    var self = this;

    self.clear_connect_timeout();

    self._connect_time_out = setTimeout(function () {
        if(self._connect_time_out != undefined){
            self._connect_time_out = undefined;
            self.close();
        }
    }, 2000);
};

communicator_json.prototype.clear_connect_timeout = function () {
    var self = this;

    if(self._connect_time_out != undefined){
        clearTimeout(self._connect_time_out);
        self._connect_time_out = undefined;
    }
};

communicator_json.prototype._closed = function () {
    var self = this;

    self.clear_connect_timeout();
    self.buffer.clear();
    if(self.client){
        self.client.removeAllListeners();
        self.client = undefined;
    }

    logger.info('socket json(host: %s, port: %s) connect closed', self.host, self.port);
    try{
        if(self.isOpened){
            self.isOpened = false;
            if(self.closed){
                self.closed();
            }
        }
    }catch(err){
        logger.error({msg : 'socket json handle closed failed', err: err});
    }
    if(self.destoryed){
        if(self._reconnect_time_out != undefined){
            clearTimeout(self._reconnect_time_out);
            self._reconnect_time_out = undefined;
        }
        return;
    }
    if(!self.isDataPipe && self._reconnect_time_out == undefined){
        self._reconnect_time_out = setTimeout(function () {
            self._reconnect_time_out = undefined;

            self.connect();
        }, self.reconnect_interval)
    }
};

communicator_json.prototype.close = function (destory) {
    var self = this;

    logger.info('try close connection of socket json(host: %s, port: %s)', self.host, self.port);
    if(destory){
        self.connected = undefined;
        self.closed = undefined;
        self.notify_received = undefined;
        self.destoryed = destory;
    }

    if(self.client){
        self.client.removeAllListeners();
        self.client.end();
        self.client.destroy();

        self._closed();
    }
};

communicator_json.prototype.send = function (msg, callback, timeout) {
    if(this.client && this.isOpened){
        msg.msgId = gen_msg_id();

        logger.debug('send data to socket json(host: %s, port: %s, cmd: %s, id: %d)', this.host, this.port, msg.cmd, msg.msgId);
        if(!timeout){
            timeout = this.send_time_out;
        }
        this.msg_dic[msg.msgId] = {
            time: Date.now(),
            cmd: msg.cmd,
            callback: callback,
            timeout: timeout
        };
        this.start_check_time_out();

        this.notify(msg);
    }else{
        callback({msg: 'connection is not open'});
    }
};

communicator_json.prototype.read_body_length =  function (data) {
    return data.readUInt32LE(0);
};

communicator_json.prototype.notify = function (msg) {
    if(this.client && this.isOpened) {
        this.client.write(this.pack_msg(msg));
        return true;
    }else{
        return false;
    }
};

communicator_json.prototype.pack_msg = function (msg) {
    var data = JSON.stringify(msg);

    var length = Buffer.byteLength(data);
    var packet = new Buffer(length + 4);
    packet.writeUInt32LE(length, 0);
    packet.write(data, 4);

    return packet;
};

communicator_json.prototype.start_check_time_out = function () {
    let self = this;
    if(self.is_checking){
        return;
    }
    self.is_checking = true;
    setTimeout(function () {
        let now = Date.now();
        let count = 0;
        for(let i in self.msg_dic){
            let item = self.msg_dic[i];
            if(now - item.time > item.timeout){
                try{
                    delete self.msg_dic[i];
                    logger.warn({msg: 'socket json send msg time out', id: i, host: self.host, port: self.port, cmd: item.cmd});
                    item.callback({msg: 'time out'});
                }catch(err){
                    logger.error({msg: 'socket json handle msg time out failed', err: err});
                }
            }else{
                count++;
            }
        }

        self.is_checking = false;
        if(count > 0){
            self.start_check_time_out();
        }
    }, 1000);
};

module.exports = communicator_json;