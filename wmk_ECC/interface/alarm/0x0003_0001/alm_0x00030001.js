/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var AlarmAction = require('../../../modules/alarm/definition/alarm_action');

var Notification = require('../../../helpers/notification_helper');
var Emitter = Notification.Emitter;

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbCFG = db.cfg;
    var key = sysConfigKey.hr_alarm_notify_plug_in;
    dbCFG.update_system_config(svrType, key, body, function (err) {
        if(err) return callback(err);

        db.ramdb.cfg.set_system_config(key, body);
        dbOPL.insert_user_log(AlarmAction.alarm_notify_config, req.user, '修改告警通知配置', req.body, new Date());
        Notification.emit(Emitter.config, 'hr_alarm_notify_plug_in', body);

        callback();
    })
}

module.exports.cmd = cmd.alm_0x00030001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        url: {type: 'string', required: true}
    }
};