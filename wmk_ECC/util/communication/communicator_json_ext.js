/**
 * Created by wangxh on 2017/5/31.
 */

'use strict';

var util = require('util');
var net = require('net');
var _logger = require('../../util/log_manager');
var logger = _logger.logger;
var stateLog = _logger.stateLog;
var SocketBuffers = require('./socket_buffer');

const fixed_head = 0xFBA99ABF;
const head_length = 12;
const chk_length = 4;

function communicator_json_ext() {
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
        var cmd = undefined;
        var body = undefined;
        var msg = undefined;
        try{
            cmd = packet.readUInt32LE(4);
            body = packet.slice(head_length, packet.length - chk_length).toString();
            msg = JSON.parse(body);
        }catch(err){
            self.close();
            logger.error({msg: 'socket json ext parse packet failed', body: body, err: err});
            stateLog.error('[EXT:(%s:%s)][通讯协议错误,断开连接][%s]', self.host, self.port, body);
            return;
        }
        if(msg){
            try{
                if((cmd & 0x10000) == 0x10000){
                    var cache = self.msg_dic[cmd];
                    if(cache){
                        delete self.msg_dic[cmd];
                        cache.callback(undefined, msg);
                    }else{
                        logger.error({msg: 'socket json ext try handle msg callback cmd not found'});
                    }
                }else if ((cmd & 0xF000) == 0xF000){
                    if(self.notify_received){
                        self.notify_received(cmd, msg);
                    }
                }else{
                    if(self.req_received){
                        self.req_received(cmd, msg, function (res) {
                            self.notify(res);
                        });
                    }else{
                        logger.warn({msg: 'socket json ext try handle req handler delegate not found'});
                    }
                }
            }catch(err){
                logger.error({msg: 'socket json ext try handle packet failed', cmd: cmd, body: body, err: err});
            }
        }
    });
    self.buffer = hbd;
}

communicator_json_ext.prototype.connect = function (host, port) {
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
        logger.info('socket json ext(host: %s, port: %s) connected', self.host, self.port);
        self.clear_connect_timeout();
        self.buffer.clear();
        try{
            self.isOpened = true;
            if(self.connected){
                self.connected();
            }
        }catch(err){
            logger.error({msg: 'socket json ext handle collected failed', err: err});
        }
    });
    socket.on('close', function() {
        logger.error('socket json ext(host: %s, port: %s) connection closed', self.host, self.port);

        self._closed();
    });
    socket.on('data', function(data) {
        logger.debug('socket json ext(host: %s, port: %s) receive data', self.host, self.port);

        self.buffer.add_buffer(data);
    });
    socket.on('error', function(err) {
        logger.error('socket json ext(host: %s, port: %s) connection error', self.host, self.port, err.message);
        self.close();
    });
    socket.on('timeout', function () {
        logger.error('socket json ext(host: %s, port: %s) connection time out', self.host, self.port);
        self.close();
    });

    logger.info('try connect to (host: %s, port: %s)', self.host, self.port);

    self.check_connect_timeout();
    socket.connect({host: self.host, port: self.port});
};

communicator_json_ext.prototype.as_data_pipe = function (socket) {
    var self = this;

    self.isDataPipe = true;
    self.isOpened = true;
    self.host = socket.remoteAddress;
    self.port = socket.remotePort;

    socket.setTimeout(0);
    socket.setNoDelay(true);

    this.client = socket;

    socket.on('close', function() {
        logger.error('socket json ext(host: %s, port: %s) connection closed', self.host, self.port);

        self._closed();
    });
    socket.on('data', function(data) {
        logger.debug('socket json ext(host: %s, port: %s) receive data', self.host, self.port);

        self.buffer.add_buffer(data);
    });
    socket.on('error', function(err) {
        logger.error('socket json ext(host: %s, port: %s) connection error', self.host, self.port, err.message);
        self.close();
    });
    socket.on('timeout', function () {
        logger.error('socket json ext(host: %s, port: %s) connection time out', self.host, self.port);
        self.close();
    });
};

communicator_json_ext.prototype.check_connect_timeout = function () {
    var self = this;

    self.clear_connect_timeout();

    self._connect_time_out = setTimeout(function () {
        if(self._connect_time_out != undefined){
            self._connect_time_out = undefined;
            self.close();
        }
    }, 2000);
};

communicator_json_ext.prototype.clear_connect_timeout = function () {
    var self = this;

    if(self._connect_time_out != undefined){
        clearTimeout(self._connect_time_out);
        self._connect_time_out = undefined;
    }
};

communicator_json_ext.prototype._closed = function () {
    var self = this;

    self.clear_connect_timeout();
    self.buffer.clear();
    if(self.client){
        self.client.removeAllListeners();
        self.client = undefined;
    }

    logger.error('socket json ext(host: %s, port: %s) connect closed', self.host, self.port);
    try{
        if(self.isOpened){
            self.isOpened = false;
            if(self.closed){
                self.closed();
            }
        }
    }catch(err){
        logger.error({msg : 'socket json ext handle closed failed', err: err});
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

communicator_json_ext.prototype.close = function (destory) {
    var self = this;
    logger.info('try close connection of socket json ext(host: %s, port: %s)', self.host, self.port);
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

communicator_json_ext.prototype.send = function (msg, callback, timeout) {
    if(this.client && this.isOpened){
        logger.debug('send data to socket json ext(host: %s, port: %s, cmd: %s)', this.host, this.port, msg.cmd);
        if(!timeout){
            timeout = this.send_time_out;
        }
        this.msg_dic[msg.rnd] = {
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

communicator_json_ext.prototype.read_body_length =  function (data) {
    return data.readUInt32LE(8) + chk_length;
};

communicator_json_ext.prototype.notify = function (msg) {
    if(this.client && this.isOpened) {
        this.client.write(this.pack_msg(msg));
        return true;
    }else{
        return false;
    }
};

communicator_json_ext.prototype.pack_msg = function (msg) {
    var data = JSON.stringify(msg.data);
    var length = Buffer.byteLength(data);

    var packet = new Buffer(length + 16);
    packet.writeUInt32LE(fixed_head, 0);
    packet.writeUInt32LE(msg.cmd, 4);
    packet.writeUInt32LE(length, 8);
    packet.write(data, 12);

    //校验
    var chk = 0;
    for(var i=0;i<length+12;i++){
        chk += packet.readUInt8(i);
    }
    packet.writeUInt32LE(chk, length+12);

    return packet;
};

communicator_json_ext.prototype.start_check_time_out = function () {
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
                    logger.error({msg: 'socket json ext send msg time out', id: i, host: self.host, port: self.port, cmd: item.cmd});
                    item.callback({msg: 'time out'});
                }catch(err){
                    logger.error({msg: 'socket json ext handle msg time out failed', err: err});
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

module.exports = communicator_json_ext;