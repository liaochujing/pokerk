/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var ah = require('../../../util/array_helper');

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

    var now = new Date();

    var _identity = body;
    var _container = body.container;

    if(_identity.serverNO != _container.serverNO){
        callback({status: code.not_found, msg: '对象关系不可跨楼栋！'});
        return;
    }

    function update_name_object_time(done) {
        dbNO.update_nameobject_time(_identity.childServerNO, _identity.childClassID, _identity.childID, now, function (err) {
            if(err){
                done(err);
                return;
            }
            done();
        });
    }
    
    function remove_relation(done) {
        var _parent = db.ramdb.nor.get_parent_identity(_identity.serverNO, _identity.classID, _identity.id);
        if(_parent){
            var _relation = {serverNO: _parent.serverNO, classID: _parent.classID, id: _parent.id, childServerNO: _identity.serverNO, childClassID: _identity.classID, childID: _identity.id};
            dbNOR.clear_no_relation(_relation, function (err) {
                if(err){
                    done(err);
                    return;
                }

                db.ramdb.nor.del_relation(_relation);
                notifyHelper.send_notify(new NotifyMsg(NotifyType.name_object_del_relation, {serverNO: _parent.serverNO, classID: _parent.classID, id: _parent.id, childServerNO: _identity.serverNO, childClassID: _identity.classID, childID: _identity.id, time: new Date(now.getTime() - 1)}));

                done();
            });
        }else{
            done();
        }
    }
    
    function add_relation(done) {
        dbNOR.insert_relation(_container.serverNO, _container.classID, _container.id, _identity.serverNO, _identity.classID, _identity.id, function (err) {
            if(err){
                done(err);
                return;
            }

            db.ramdb.nor.add_nor({serverNO: _container.serverNO, classID: _container.classID, id: _container.id, childServerNO: _identity.serverNO, childClassID: _identity.classID, childID: _identity.id});
            notifyHelper.send_notify(new NotifyMsg(NotifyType.name_object_add_relation, {serverNO: _container.serverNO, classID: _container.classID, id: _container.id, childServerNO: _identity.serverNO, childClassID: _identity.classID, childID: _identity.id, time: now}));

            done();
        });
    }
    
    ah.series([update_name_object_time, remove_relation, add_relation], function (err) {
        if(err) {
            return callback(err);
        }

        var _p = rdbNO.get_by_identity(body.container);
        var _c = rdbNO.get_by_identity(body);
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
        dbOPL.insert_user_log(ManagerAction.modify_relation, req.user, '移动:' + cname + ' 至 ' + pname, req.body, new Date());

        callback();
    });
}

module.exports.cmd = cmd.mgr_0x00010014;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        container: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        }
    }
};