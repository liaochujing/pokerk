/**
 * Created by wangxh on 2017/10/10.
 */

'use strict';

var util = require('util');
var mongoose = require('mongoose');
var st = require('../../util/small_tools');
var _logger = require('../../util/log_manager');
var logger = _logger.logger;
var stateLog = _logger.stateLog;
var dbConfig = require('../../config/db_config').data;

var options = {
    server: {socketOptions: { keepAlive: 1, connectTimeoutMS: 30000} , reconnectTries:Number.MAX_VALUE, reconnectInterval:3000},
    replset: {socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}}
};

var _connected = false;
var db = mongoose.createConnection(dbConfig.url,  options);
db.on('error',function (err) {
    logger.error({msg: 'mongo err', err: err});

    var message = err.message;
    if(message.indexOf('ECONNREFUSED') >= 0 || message.indexOf('connection timeout') >= 0 || message.indexOf('sockets closed') >= 0){//无法连接到数据库
        stateLog.error('[历史数据库][通讯故障,5s后尝试重启服务][%s]', err.message);
    }else{
        stateLog.error('[历史数据库][异常][%s]', err.message);
    }
    setTimeout(function () {
        st.restart_service('mongo connection error');
    }, 5000);
});
db.once('open',function(){
    logger.info("mongo data opened!");
    _connected = true;
});

function init(param, done) {

    var hisalarm = require('./alarm/hisalarm')(db);//历史告警
    var hisdp = require('./base/hisdp')(db);//历史点

    adapters.hisalarm = hisalarm;
    adapters.hisdp = hisdp;

    var DataCollection = require('./base/data');

    var dmdata = DataCollection('dmdata', db, {cache: 1, keep_days: 2});//设备
    var dmday = DataCollection('dmday', db, {cache: 1, keep_days: 35});
    var dmmon = DataCollection('dmmon', db);
    adapters.dmdata = dmdata;
    adapters.dmday = dmday;
    adapters.dmmon = dmmon;

    var cmdata = DataCollection('cmdata', db, {cache: 1, keep_days: 2});//机柜
    var cmday = DataCollection('cmday', db, {cache: 1, keep_days: 35});
    var cmmon = DataCollection('cmmon', db);
    // var cmyear = DataCollection('cmyear', db);
    adapters.cmdata = cmdata;
    adapters.cmday = cmday;
    adapters.cmmon = cmmon;
    // adapters.cmyear = cmyear;

    var rmdata = DataCollection('rmdata', db, {cache: 1, keep_days: 2});//机房
    var rmday = DataCollection('rmday', db, {cache: 1, keep_days: 35});
    var rmmon = DataCollection('rmmon', db);
    var rmyear = DataCollection('rmyear', db);
    adapters.rmdata = rmdata;
    adapters.rmday = rmday;
    adapters.rmmon = rmmon;
    adapters.rmyear = rmyear;

    var amdata = DataCollection('amdata', db, {cache: 1, keep_days: 2});//区域
    var amday = DataCollection('amday', db, {cache: 1, keep_days: 35});
    var ammon = DataCollection('ammon', db);
    var amyear = DataCollection('amyear', db);
    adapters.amdata = amdata;
    adapters.amday = amday;
    adapters.ammon = ammon;
    adapters.amyear = amyear;

    var stdata = DataCollection('stdata', db, {cache: 1, keep_days: 2});//系统
    var stday = DataCollection('stday', db, {cache: 1, keep_days: 35});
    var stmon = DataCollection('stmon', db);
    var styear = DataCollection('styear', db);
    adapters.stdata = stdata;
    adapters.stday = stday;
    adapters.stmon = stmon;
    adapters.styear = styear;

    var sgdata = DataCollection('sgdata', db, {cache: 1, keep_days: 2});//系统组
    var sgday = DataCollection('sgday', db, {cache: 1, keep_days: 35});
    var sgmon = DataCollection('sgmon', db);
    var sgyear = DataCollection('sgyear', db);
    adapters.sgdata = sgdata;
    adapters.sgday = sgday;
    adapters.sgmon = sgmon;
    adapters.sgyear = sgyear;

    var astLog = require('./assets/assets_action_log')(db);
    adapters.astLog = astLog;
    var alarm_log = require('./alarm/alarm_log')(db);
    adapters.aml = alarm_log;
    var his_alarm_log = require('./alarm/his_alarm_log')(db);
    adapters.hisaml = his_alarm_log;
    var ooperator_action_log = require('./user/operator_log')(db);
    adapters.opl = ooperator_action_log;
    var system_log = require('./base/system_log')(db);
    adapters.sysl = system_log;
    var cabinet_power_state_log = require('./base/cabinet_power_state_log')(db);
    adapters.capsl = cabinet_power_state_log;
    var mobile_inspection = require('./other/mobile_inspection')(db);
    adapters.minsp = mobile_inspection;
    var hotstandby = require('./other/hotstandby')(db);
    adapters.hotstandby = hotstandby;
    adapters.lcl = require('./base/link_control_log')(db);

    if(_connected){
        done();
    }else{
        var _interval = setInterval(function () {
            if(_connected){
                clearInterval(_interval);
                done();
            }
        }, 100)
    }
}

const adapters = {};
module.exports.adapters = adapters;
module.exports.init = init;