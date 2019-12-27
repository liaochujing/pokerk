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
var logger = require('../../../util/log_manager').logger;
var db = require('../../../db/index');
var dbrole = db.role;
var role = db.ramdb.role;
var dbOPL = db.datadb.opl;
var dbObjID = db.objID;

function handle(req, res, body, callback) {
    var user = req.user;

    var time = new Date();

    var psdata = {
        type: body.type,
        name: body.name,
        option: {},
        time: time
    }

    psdata.option.privilegeList = body.privilegeList;
    if(body.data){
        psdata.option.data = body.data;
    }

    dbObjID.gen_object_id('role', function (err, id) {
        if (err) {
            logger.error(err);
            callback(err);
            return;
        } else {
            dbrole.insert_role(id, psdata.type, psdata.name, psdata.option, function (err) {
                if (err) {
                    logger.error(err);
                    callback(err);
                    return;
                }else{
                    psdata.id = id;
                    role.set_role(psdata);

                    notifyHelper.send_notify(new NotifyMsg(NotifyType.role_created, psdata));
                    dbOPL.insert_user_log(OperatorAction.add_role, req.user, '添加岗位权限', body, time);
                    callback(null, psdata);
                }
            });
        }
    });
}

module.exports.privilege = PrivilegePoint.addRole;
module.exports.cmd = cmd.usr_0x00000014;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        privilegeList: {type: 'array', items: { type: 'number' }, required: true},
        name: {type: 'string', required: true},
        data: {type: 'object'},
        type: {type: 'number', required: true}
    },
    required: true
};
