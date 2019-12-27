/**
 * Created by wangxh on 2017/9/22.
 */

'use strict';

var util = require('util');
var mongoose = require('mongoose');
var st = require('../../util/small_tools');
var _logger = require('../../util/log_manager');
var logger = _logger.logger;
var stateLog = _logger.stateLog;
var dbConfig = require('../../config/db_config').main;

var options = {
    server: {socketOptions: { keepAlive: 1, connectTimeoutMS: 30000} , reconnectTries:Number.MAX_VALUE, reconnectInterval:3000},
    replset: {socketOptions: {keepAlive: 1, connectTimeoutMS: 30000}}
};

var _connected = false;
var db = mongoose.createConnection(dbConfig.url, options);
db.on('error',function (err) {
    logger.error({msg: 'mongo err', err: err});

    var message = err.message;
    if(message.indexOf('ECONNREFUSED') >= 0 || message.indexOf('connection timeout') >= 0 || message.indexOf('sockets closed') >= 0){//无法连接到数据库
        stateLog.error('[配置数据库][通讯故障,5s后尝试重启服务][%s]', err.message);
    }else{
        stateLog.error('[配置数据库][异常][%s]', err.message);
    }
    setTimeout(function () {
        st.restart_service('mongo connection error');
    }, 5000);
});
db.once('open',function(){
    logger.info("mongo main opened!");
    _connected = true;
});

function init(param, done) {
    var objID = require('./base/objectid')(db);
    adapters.objID = objID;
    var cfg = require('./base/system_config')(db);
    adapters.cfg = cfg;

    var nor = require('./base/relation')(db);
    var no = require('./base/nameobject')(db);
    var privilege = require('./base/privilege')(db);
    adapters.nor = nor;
    adapters.no = no;
    adapters.privilege = privilege;

    var operator_object = require('./user/operator_object')(db);
    var operator_relation = require('./user/operator_relation')(db);
    var work_sheet = require('./user/work_sheet')(db);
    var work_log = require('./user/work_log')(db);
    var role = require('./user/role')(db);
    adapters.oo = operator_object;
    adapters.oor = operator_relation;
    adapters.wst = work_sheet;
    adapters.wlg = work_log;
    adapters.role = role;

    var alarm = require('./alarm/alarm')(db);
    adapters.alarm = alarm;

    var alp = require('./alarm/alarm_type')(db);
    var dep = require('./base/device_type')(db);
    var collect_object = require('./collect/collect_object')(db);
    var collect_relation = require('./collect/collect_relation')(db);
    var collect_device_type = require('./collect/collect_device_type')(db);
    var collect_device_point = require('./collect/collect_device_point')(db);
    var collect_config = require('./collect/collect_config')(db);
    var dp = require('./base/devicepoint')(db);
    adapters.dep = dep;
    adapters.cno = collect_object;
    adapters.cnor = collect_relation;
    adapters.dp = dp;
    adapters.alp = alp;
    adapters.cdt = collect_device_type;
    adapters.cdp = collect_device_point;
    adapters.cocfg = collect_config;

    var assetType = require('./asset/asset_type')(db);
    var asset = require('./asset/assets')(db);
    var parts = require('./asset/parts')(db);
    var parts_type = require('./asset/parts_type')(db);
    var customer = require('./asset/customer')(db);
    var supplier = require('./asset/supplier')(db);
    var attribute = require('./asset/attributes')(db);
    adapters.ast = assetType;
    adapters.asset = asset;
    adapters.parts = parts;
    adapters.pst = parts_type;
    adapters.customer = customer;
    adapters.supplier = supplier;
    adapters.attribute = attribute;

    var order = require('./order/order')(db);
    adapters.order = order;
    var order_template = require('./order/order_template')(db);
    adapters.order_template = order_template;
    var attachment = require('./base/attachment')(db);
    adapters.attachment = attachment;

    var rtp = require('./base/report_templage')(db);
    adapters.rtp = rtp;

    var ofn = require('./base/offline_notify')(db);
    adapters.ofn = ofn;
    var ofm = require('./base/offline_message')(db);
    adapters.ofm = ofm;

    var config_file = require('./base/config_file')(db);
    adapters.cfgFile = config_file;
    adapters.lc = require('./base/link_control')(db);
    adapters.areaAlarmConfig = require('./alarm/area_alarm_config')(db);


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