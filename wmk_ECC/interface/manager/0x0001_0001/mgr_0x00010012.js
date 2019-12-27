/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbNO = db.no;
    var dbNOR = db.nor;
    var rdbNO = db.ramdb.no;

    var _parent = db.ramdb.nor.get_parent_identity(body.childServerNO, body.childClassID, body.childID);
    if(_parent){
        callback({status: code.other, msg: '此对象已存在容器关系,不可重复添加！'});
        return;
    }
    if(body.serverNO != body.childServerNO){
        callback({status: code.other, msg: '对象关系不可跨楼栋！'});
        return;
    }

    body.time = new Date();
    dbNO.update_nameobject_time(body.childServerNO, body.childClassID, body.childID, body.time, function (err) {
        if(err){
            callback(err);
            return;
        }

        dbNOR.insert_relation(body.serverNO, body.classID, body.id, body.childServerNO, body.childClassID, body.childID, function (err) {
            if(err){
                callback(err);
                return;
            }

            db.ramdb.nor.add_nor({serverNO: body.serverNO, classID: body.classID, id: body.id, childServerNO: body.childServerNO, childClassID: body.childClassID, childID: body.childID});
            notifyHelper.send_notify(new NotifyMsg(NotifyType.name_object_add_relation, body));

            var _p = rdbNO.get_no_sync(body.serverNO, body.classID, body.id);
            var _c = rdbNO.get_no_sync(body.childServerNO, body.childClassID, body.childID);
            var pname = '';
            var cname = '';
            if(_p){
                pname = _p.fullName
            }else{
                pname = '未知';
            }
            if(_c){
                cname = _c.fullName
            }else{
                cname = '未知';
            }
            dbOPL.insert_user_log(ManagerAction.add_relation, req.user, '添加容器关系:' + pname + '>' + cname, req.body, new Date());

            callback();
        });
    });
}

module.exports.cmd = cmd.mgr_0x00010012;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        childServerNO: {type: 'number', required: true},
        childClassID: {type: 'number', required: true},
        childID: {type: 'number', required: true}
    }
};