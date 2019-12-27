/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var privilegePoint = require('../../../definition/privilege_point');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbCNOR = db.cnor;

    var _object = db.ramdb.cno.get_by_identity(body);
    if(_object){
        var childs = db.ramdb.cnor.get_child_identity(body.serverNO, body.classID, body.id);
        if(childs && childs.length > 0){
            callback({status: code.other, msg: '包含子对象，无法删除'});
            return;
        }

        _object.delete_db(function (err) {
            if(err){
                callback(err);
                return;
            }
            dbCNOR.delete_relation(_object.serverNO, _object.classID, _object.id, function (err) {
                if(err) callback(err);
                
                db.ramdb.cno.del_cno(_object);
                db.ramdb.cnor.del_cnor({serverNO: _object.serverNO, classID: _object.classID, id: _object.id});

                notifyHelper.send_notify(new NotifyMsg(NotifyType.collect_object_removed, {serverNO: _object.serverNO, classID: _object.classID, id: _object.id}));
                dbOPL.insert_user_log(ManagerAction.delete_collect_object, req.user, '删除采集对象:' + _object.fullName, _object.gen_json_data(), new Date());

                callback();
            });
        });
    }else{
        callback({status: code.not_found, msg: 'object not found'});
    }
}

module.exports.privilege = privilegePoint.removeCollectDevice;
module.exports.cmd = cmd.mgr_0x00020003;
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