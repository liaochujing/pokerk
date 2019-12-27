/**
 * Created by wangxh on 2018/8/23.
 */

'use strict';

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var communicator = require('../../../util/communication/communicator');
var sysConfigKey = require('../definition/system_config_key');
var db = require('../../../db');
var rdbCFG = db.ramdb.cfg;

var _comm = undefined;//通讯连接
var _module = undefined;//通讯模块配置
var _interval = 0;
var _config_dic = undefined;
var _alarm_dic = {};//告警列表
var _aom_state = 0;//0:unknown，1：alarming，2：non alarm
var _expired_time = 0;

function close() {
    if(_comm){
        _comm.close(true);
        _comm = undefined;
    }
}

function connect() {
    close();

    _comm = new communicator();
    _comm.connect(_module.host, _module.port);
}

function _start() {
    if(_comm && _module && _module.address != undefined){
        var data = new Buffer([0x01, 0xBD, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x05, 0x00, 0x64, 0xFF, 0x00]);
        ah.retry({times: 3, interval: 1000}, function (cb) {
            if(_aom_state != 1){
                return cb();
            }
            var isSend = _comm.send(data);
            if(isSend){
                cb();
            }else{
                cb({msg: 'send failed'})
            }
        }, function (err) {
            if(err){
                logger.error({msg: 'start aom alarm failed', err: err});
            }
        })
    }
}

function _stop() {
    if(_comm && _module && _module.address != undefined){
        var data = new Buffer([0x01, 0xBD, 0x00, 0x00, 0x00, 0x06, 0xFF, 0x05, 0x00, 0x64, 0x00, 0x00]);
        ah.retry({times: 3, interval: 1000}, function (cb) {
            if(_aom_state != 2){
                return cb();
            }
            var isSend = _comm.send(data);
            if(isSend){
                cb();
            }else{
                cb({msg: 'send failed'})
            }
        }, function (err) {
            if(err){
                logger.error({msg: 'stop aom alarm failed', err: err});
            }
        })
    }
}


function start_alarm(last_interval) {//分钟
    if(_aom_state != 1){
        _aom_state = 1;
        if(last_interval == 0){//持续报警
            _expired_time = 0;
        }else if(last_interval > 0){
            _expired_time = Date.now() + last_interval * 60000;
        }
        _start();
    }else{
        if(_expired_time != 0){//非持续报警
            if(Date.now() >= _expired_time){//已到期
                clear_alarm();
            }
        }
    }
}

function stop_alarm(immediately) {
    if(_aom_state != 2 || immediately){
        _aom_state = 2;
        _stop();
    }
}


function push_alarm(serverNO, classID, id) {
    if(_config_dic && _config_dic[classID]){
        var key = format_key(serverNO, id);
        _alarm_dic[key] = 1;
    }
}

function pull_alarm(serverNO, classID, id) {
    if(_config_dic && _config_dic[classID]) {
        var key = format_key(serverNO, id);
        delete _alarm_dic[key];
    }
}

function clear_alarm() {
    _alarm_dic = {};
    stop_alarm(true);
}


function update_config(config) {
    if(config && config.enabled){
        var _changed = false;
        if(!_module || config.module.host != _module.host || config.module.port != _module.port){
            _changed = true;
        }
        _module = config.module;
        _interval = config.interval;
        _config_dic = {};
        for(var i=0;i<config.alarms.length;i++){
            var item = config.alarms[i];
            _config_dic[item] = 1;
        }
        if(_module && _changed){
            connect();
        }
    }else{
        close();

        _interval = 0;
        _module = undefined;
        _config_dic = undefined;
        clear_alarm();
    }
}

function start_process() {
    var config = rdbCFG.get_system_config(sysConfigKey.alarm_aom_config);
    update_config(config);

    setInterval(function () {
        var _has = false;
        for(var key in _alarm_dic){
            _has = true;
            break;
        }
        if(_has){
            start_alarm(_interval);
        }else{
            stop_alarm();
        }
    }, 3000);
}

module.exports.start_process = start_process;
module.exports.push_alarm = push_alarm;
module.exports.pull_alarm = pull_alarm;
module.exports.clear_alarm = clear_alarm;
module.exports.update_config = update_config;