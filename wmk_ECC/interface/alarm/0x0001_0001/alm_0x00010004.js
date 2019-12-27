/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var PrivilegePoint = require('../../../definition/privilege_point');
var AlarmAction = require('../../../modules/alarm/definition/alarm_action');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var user = req.user;

    var dbALP = db.alp;
    dbALP.remove_alarm_type(body.id, function (err) {
        if(err) callback(err);

        var alp = db.ramdb.alp.del_alarm_type(body.id);
        notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_type_deleted, body));

        dbOPL.insert_user_log(AlarmAction.alarm_type_deleted, user, '删除告警条件:' + alp.name, alp, new Date());

        callback();
    });
}

module.exports.privilege = PrivilegePoint.removeAlarmType;
module.exports.cmd = cmd.alm_0x00010004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true}
    }
};