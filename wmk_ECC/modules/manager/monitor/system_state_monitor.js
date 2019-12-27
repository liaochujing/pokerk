/**
 * Created by wangxh on 2017/12/28.
 */

'use strict';

var os = require('os');

var db = require('../../../db/index');
var datadb = db.datadb;

var SystemLogType = require('./../definition/system_log_type');

function start_monitor_service_state() {
    var sysl = datadb.sysl;
    setInterval(function () {
        sysl.insert_sys_log(SystemLogType.system_state, '系统状态', {uptime: os.uptime(), freemem: os.freemem(), load: os.loadavg()[0]}, new Date());
    }, 5 * 60 * 1000);
}

module.exports.start_monitor_service_state = start_monitor_service_state;