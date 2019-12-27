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
        var time = new Date();
        psdata.option.privilegeList = body.privilegeList;
        psdata.time = time;
        if(body.name){
            psdata.name = body.name;
        }
        if(body.type){
            psdata.type = body.type;
        }
        if(body.option){
            psdata.option.data = body.option.data;
        }
        var update = { $set: { name: psdata.name,type: psdata.type ,option: psdata.option,time: psdata.time } };

        dbrole.update_role(body.id, update, function (err, result){
            if (err) return callback(err);

            notifyHelper.send_notify(new NotifyMsg(NotifyType.role_modified, psdata));
            dbOPL.insert_user_log(OperatorAction.modify_role, req.user, '修改岗位权限', body, time);
            callback(null, {});
        });
    }else{
        callback({status: code.not_found, msg: 'not found!'});
    }
}

module.exports.privilege = PrivilegePoint.modifyRole;
module.exports.cmd = cmd.usr_0x00000012;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: { type: 'number', required: true },
        privilegeList: { type: 'array', items: { type: 'number' }, required: true },
        data: { type: 'object' },
        name: { type: 'string' },
        type: { type: 'number' }
    },
    required: true
};