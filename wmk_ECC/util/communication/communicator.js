/**
 * Created by wangxh on 2017/7/19.
 */

'use strict';

var util = require('util');
var net = require('net');
var logger = require('../log_manager').logger;

function communicator() {
    //变量
    this.socket = null;
    this.timeout = 1000 * 6;

    this.isOpened = false;
    this.useOpened = null;
    this.useClosed = null;
    this.dataReceived = null;
    this.useTimeouted = null;

    this.isDataPipe = false;
    this.default_timeout = 1000 * 5;

    this.RemoteAddress = function () {
        if(this.socket){
            var strIP = this.socket.remoteAddress;
            if(strIP){
                return strIP.replace('::ffff:', '');
            }else{
                return '';
            }
        }else{
            return '';
        }
    };

    this.GetIsOpened = function () {
        return this.isOpened;
    };
}

communicator.reconnect_time_closed = 2000; //连接断开重连时间间隔
communicator.reconnect_time_out = 2000; //超时重连时间间隔

communicator.prototype.trigger_timeout = function () {
    var self = this;

    if(self.isOpened){
        var host = self.host;
        var port = self.port;

        logger.error('user comm(%s:%s)connection time out', host, port);
        try {
            if (self.useTimeouted != null) {
                self.useTimeouted();
            }
        } catch (e) {
            logger.info({msg: 'handle comm timeout callback failed', err: e});
        }
    }else{
        logger.error('user comm(%s:%s)connection time out while comm is closed', host, port);
    }
};

communicator.prototype.check_timeout = function () {
    var self = this;

    var timeout = self.timeout;
    if (timeout == undefined) {
        timeout = self.default_timeout;
    }

    if(self._timeout_id == undefined){
        self._timeout_id = setTimeout(function () {
            self._timeout_id = undefined;

            self.trigger_timeout();
        }, timeout);
    }
};

communicator.prototype.clear_timeout = function () {
    var self = this;

    if (self._timeout_id != undefined) {
        clearTimeout(self._timeout_id);
        self._timeout_id = undefined;
    }
};

communicator.prototype.check_connect_timeout = function () {
    var self = this;

    self.clear_connect_timeout();

    self._connect_time_out = setTimeout(function () {
        if(self._connect_time_out != undefined){
            self._connect_time_out = undefined;

            self.close();
        }
    }, 2000);
};

communicator.prototype.clear_connect_timeout = function () {
    var self = this;

    if(self._connect_time_out != undefined){
        clearTimeout(self._connect_time_out);
        self._connect_time_out = undefined;
    }
};

communicator.prototype.set_time_out = function (timeout) {
    this.timeout = timeout;
};

communicator.prototype.send = function (data) {
    var isSend = this.send_without_timeout(data);
    if(isSend){
        this.check_timeout();
    }
    return isSend;
};

communicator.prototype.send_without_timeout = function (data) {
    var isSend = false;

    var host = this.host;
    var port = this.port;

    try {
        if (this.socket && this.isOpened) {
            this.socket.write(data);
            isSend = true;
        } else {
            logger.warn('comm(%s:%s) send data failed: conn is not open', host, port);
        }
    } catch (e) {
        logger.info({msg: 'comm send data failed', host: host, port: port, err: e});
    }

    return isSend;
};

communicator.prototype.initSocket = function (socket) { //初始化socket
    if (socket != null) {
        var self = this;

        //处理连接错误
        socket.on('error', function (err) {
            var host = self.host;
            var port = self.port;

            logger.error('comm(%s:%s) connect error: %s', host, port, err.message);

            self.close();
        });
        socket.on('connect', function () {
            var host = self.host;
            var port = self.port;

            self.clear_connect_timeout();
            self.clear_timeout();
            logger.info('comm(%s:%s) connected', host, port);
            try {
                self.isOpened = true;
                if (self.useOpened != null) {
                    self.useOpened();
                }
            } catch (e) {
                logger.error({msg: 'handle comm connected event error', err: e});
            }
        });
        socket.on('close', function (has_err) {
            logger.error('connection of: %s:%s comm closed', self.host, self.port);
            self._closed();
        });
        socket.on('data', function (data) {
            var host = self.host;
            var port = self.port;

            try {
                self.clear_timeout();

                if (self.dataReceived != null) {
                    self.dataReceived(data);
                }
            } catch (e) {
                logger.info({msg: 'handle data received eventfailed', host: host, port: port, err: e});
            }
        });
        // socket.on('timeout', function () {
        //     self.trigger_timeout();
        // });
    } else {
        logger.info('can not init comm: socket is null');
    }
};

communicator.prototype.asDataPipe = function (socket) { //设置通讯对象为数据通道
    if (socket != null) {
        if (this.socket != null) {
            this.close();
        }

        this.isDataPipe = true;
        this.isOpened = true;
        this.host = socket.remoteAddress;
        this.port = socket.remotePort;

        this.socket = socket;

        this.initSocket(this.socket);
    } else {
        logger.info('can not set comm: socket is null');
    }
};

communicator.prototype._closed = function () {
    var self = this;

    self.clear_connect_timeout();
    self.clear_timeout();

    if(self.socket){
        self.socket.removeAllListeners();
        self.socket = undefined;
    }

    var host = self.host;
    var port = self.port;
    logger.error('connection(%s:%s) closed, with no error', host, port);

    try {
        self.isOpened = false;
        if (self.useClosed != null) {
            self.useClosed();
        }
    } catch (e) {
        logger.error({msg: 'handle useClosed failed', err: e});
    }

    if (!self.isDataPipe && self._reconnect_time_out == undefined) {
        if(self.destoryed){
            if(self._reconnect_time_out != undefined){
                clearTimeout(self._reconnect_time_out);
            }
            return;
        }
        self._reconnect_time_out = setTimeout(function () {
            self._reconnect_time_out = undefined;
            self.connect();
        }, communicator.reconnect_time_closed);
    }
};

communicator.prototype.connect = function (host, port) { //连接为客户端
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

    this.isDataPipe = false;

    this.socket = new net.Socket();

    this.initSocket(this.socket);

    logger.debug('start connect to: %s:%s', this.host, this.port);

    this.check_connect_timeout();
    this.socket.connect({host: this.host, port: this.port});
};

communicator.prototype.close = function (destroy) {
    var self = this;

    logger.error('close connection of: %s:%s', self.host, self.port);
    if(destroy){
        self.useOpened = null;
        self.useClosed = null;
        self.dataReceived = null;
        self.useTimeouted = null;
        self.destoryed = destroy;
    }

    if(self.socket){
        self.socket.removeAllListeners();
        self.socket.end();
        self.socket.destroy();

        self._closed();
    }
};

module.exports = communicator;