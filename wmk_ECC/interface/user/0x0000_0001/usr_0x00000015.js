/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var path = require('path');
var cmd = require('../cmd');
var code = require('../code');
var PrivilegePoint = require('../../../definition/privilege_point');
var OperatorAction = require('../../../modules/user/definition/operator_action');
var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db/index');
var dbrole = db.role;
var role = db.ramdb.role;
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var user = req.user;

    var psdata = role.get_role_by_id(body.id);
    if(psdata){
        dbrole.delete_role(psdata.id, function (err, result){
            if (err) return callback(err);

            role.del_role(psdata);
            notifyHelper.send_notify(new NotifyMsg(NotifyType.role_deleted, psdata));
            dbOPL.insert_user_log(OperatorAction.delete_role, req.user, '删除岗位权限', body, new Date());
            callback(null, {});
        });
    }else{
        callback({status: code.not_found, msg: 'not found!'});
        return;
    }
}

module.exports.privilege = PrivilegePoint.removeRole;
module.exports.cmd = cmd.usr_0x00000015;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: { type: 'number', required: true }
    },
    required: true
};
