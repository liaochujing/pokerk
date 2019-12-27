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
var OperatorAction = require('../../../modules/user/definition/operator_action');

var db = require('../../../db/index');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbOOR = db.oor;

    var _object = db.ramdb.oo.get_operator(body);
    if(_object){
        _object.delete_db(function (err) {
            if(err){
                callback(err);
                return;
            }
            dbOOR.delete_relation(_object.serverNO, _object.classID, _object.id, function (err) {
                if(err) callback(err);

                db.ramdb.oo.del_oo(_object);
                db.ramdb.oor.del_oor({serverNO: _object.serverNO, classID: _object.classID, id: _object.id});

                notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_removed, {serverNO: _object.serverNO, classID: _object.classID, id: _object.id}));
                dbOPL.insert_user_log(OperatorAction.add_group, req.user, '删除人员:' + _object.fullName, _object.gen_json_data(), new Date());

                callback()
            });
        });
    }else{
        callback({status: code.not_found, msg: 'object not found'});
    }
}

module.exports.privilege = privilegePoint.removeOperator;
module.exports.cmd = cmd.usr_0x00000007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {
            type: 'number',
            required: true
        },
        classID: {
            type: 'number',
            required: true
        },
        id: {
            type: 'number',
            required: true
        }
    }
};