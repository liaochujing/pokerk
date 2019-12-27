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
    var dbDEP = db.dep;

    dbDEP.remove_device_type(body.system, body.group, body.id, function (err) {
        if(err) return callback(err);

        var template = {
            system: body.system,
            group: body.group,
            id: body.id
        };
        var _type = db.ramdb.dep.get_device_type(template);
        db.ramdb.dep.del_type(template);

        notifyHelper.send_notify(new NotifyMsg(NotifyType.device_type_deleted, template));
        if(_type){
            dbOPL.insert_user_log(ManagerAction.delete_device_type, req.user, '删除设备类型:' + _type.name, _type, new Date());
        }

        callback();
    });
}

module.exports.privilege = privilegePoint.removeDeviceType;
module.exports.cmd = cmd.mgr_0x00010007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        system: {
            type: 'number',
            required: true
        },
        group: {
            type: 'number',
            required: true
        },
        id: {
            type: 'number',
            required: true
        }
    }
};