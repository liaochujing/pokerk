/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbCDT = db.cdt;

    dbCDT.remove_collect_device_type(body.id, function (err) {
        if(err) return callback(err);

        var _type = db.ramdb.cdt.get_collect_device_type(body.id);
        db.ramdb.cdt.del_type(body.id);

        notifyHelper.send_notify(new NotifyMsg(NotifyType.collect_device_type_deleted, {id: body.id}));
        if(_type){
            dbOPL.insert_user_log(ManagerAction.delete_collect_device_type, req.user, '删除采集设备模板:' + _type.name, null, new Date());
        }

        callback();
    });
}

module.exports.privilege = privilegePoint.removeCollectDeviceType;
module.exports.cmd = cmd.mgr_0x00020007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true}
    }
};