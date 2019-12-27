/**
 * Created by wangxh on 2017/6/9.
 */

'use strict';

var st = require('../../util/small_tools');
var ah = require('../../util/array_helper');
var _logger = require('../../util/log_manager');
var logger = _logger.logger;
var stateLog = _logger.stateLog;
var NoticeType = require('../../definition/notice_type');
var server_manager = require('../base/server_manager');

var cmd = require('./cmd');
var code = require('./code');
var DataMsg = require('../definition/data_message');

var db = require('../../db');
var dbOFM = db.ofm;

var _isValid = false;
var _manager = undefined;
var _keep_alive_timer = undefined;

function init(config, done) {
    if(_manager != undefined){
        _manager.close(true);
    }
    if(_keep_alive_timer != undefined){
        clearInterval(_keep_alive_timer);
    }

    var handle_cmd = function (cmd, body, callback) {
        callback();
    };

    var manager = new server_manager();

    manager.host = config.host;
    manager.port = config.port;

    function keep_alive() {
        if(_isValid){
            var msg = new DataMsg(cmd.msg_0x00000002);
            send(msg, function (err, data) {
                if(err && err.status == code.connection_error){
                    logger.error('message server manager keep alive error, close connection, wait auto reconnect');
                    stateLog.error('[短信服务]保活失败，尝试断开连接重连!');
                    manager.close();
                }
            })
        }
    }

    function valid(callback) {
        var msg = new DataMsg(cmd.msg_0x00000001, {type: svrType, notifies: []});
        manager.send(msg, function (err) {
            if(err){
                logger.error({msg: 'valid message service failed', host: manager.host, port: manager.port, err: err});
                callback(err);
            }else{
                _isValid = true;

                callback();
            }
        });
    }

    function send_offline_notify() {
        dbOFM.find_offline_message(NoticeType.message, function (err, results) {
            if(err) logger.error(err);

            if(results && results.length > 0){
                ah.each_series(results, function (item, cbItem) {
                    var msg = new DataMsg(cmd.msg_0x00010001, {no: item.recipient, msg: '[' + item.title + ']' + item.content});
                    send(msg, function (err) {
                        if(err){
                            if(_isValid){
                                cbItem();
                            }else{
                                cbItem(err);
                            }
                            return;
                        }
                        dbOFM.remove_offline_message({_id: item._id}, function (err) {
                            if(err){
                                logger.error({msg: 'remove offline message failed', err: err});
                            }
                            cbItem();
                        })
                    });
                }, function () {
                })
            }
        });
    }

    manager.connected = function () {
        ah.series([valid], function (err) {
            if(err){
                return manager.close();
            }
            stateLog.info('[短信服务]连接初始化完成');

            //发送离线通知
            send_offline_notify();
        });
    };
    manager.closed = function () {
        if(_isValid){
            stateLog.error('[短信服务]连接断开');
        }
        _isValid = false;
    };
    manager.req_received = function (msg, done) {
        handle_cmd(msg.cmd, msg.data, function (err, result) {
            var status = undefined;
            var message = undefined;
            if(err){
                if(err.status != undefined){
                    status = err.status;
                }else{
                    status = code.unknown;
                }
                message = err.msg;
            } else{
                status = code.ok;
            }
            done({status: status, msgId: msg.msgId, data: result, msg: message});
        });
    };
    manager.notify_received = function (msg) {
    };

    manager.connect();

    //保活
    _keep_alive_timer = setInterval(function () {
        keep_alive();
    }, 5 * 1000);

    _manager = manager;

    if(done){
        done();
    }
}

function send(msg, callback) {
    if(_manager){
        _manager.send(msg, function (err, res) {
            if(err){
                callback({status: code.connection_error, msg: err.msg})
            }else{
                if(res && res.status === code.ok){
                    callback(undefined, res.data);
                }else{
                    var status = code.unknown;
                    if(res){
                        status = res.status;
                    }
                    callback({status: status, msg: res.msg})
                }
            }
        });
    }else{
        callback({status: code.connection_error, msg: '无法连接到短信服务'})
    }
}

function send_message(recipient, title, content, callback) {
    var msg = new DataMsg(cmd.msg_0x00010001, {no: recipient, msg: '[' + title + ']\r\n' + content});
    send(msg, function (err) {
        if(err){
            if(err.status == code.connection_error){//如果是链接错误，则缓存通知
                dbOFM.insert_offline_message(NoticeType.message, recipient, title, content, new Date(), function (saveErr) {
                    if(saveErr){
                        logger.error({msg: 'save offline message failed', err: saveErr});
                        callback(err);
                        return;
                    }
                    callback();
                })
            }else{
                callback(err);
            }
        }else{
            callback();
        }
    });
}

module.exports.init = init;
module.exports.send = send;
module.exports.send_message = send_message;