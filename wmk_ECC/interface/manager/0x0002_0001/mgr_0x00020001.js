/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var privilegePoint = require('../../../definition/privilege_point');
var objectHelper = require('../../../objects/object_helper');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var _identity = body.container;
    var _objInfo = body.object;

    var _guid = undefined;
    if(_objInfo.restData){
        _guid = _objInfo.restData.guid;
    }
    if(_guid){
        var collectors = db.ramdb.cno.get_cno_by_class(uiclassID.collector, _objInfo.serverNO);
        for(var i=0;i<collectors.length;i++){
            var _c = collectors[i];
            if(_c.guid == _guid){
                callback({status: code.unknown, msg: 'guid重复'});
                return;
            }
        }
    }

    var dbCNO = db.cno;
    var dbCNOR = db.cnor;
    var objID = db.objID;

    var container = undefined;
    if(_identity.classID == uiclassID.building){
        container = db.ramdb.no.get_by_identity(_identity);
        _identity.classID = 0;
        _identity.id = 0;
    }else if(_identity.classID >= uiclassID.area && _identity.classID <= uiclassID.lastArea){
        var _area = db.ramdb.no.get_by_identity(_identity);
        if(_area){
            container = _identity;
        }
    }else{
        container = db.ramdb.cno.get_by_identity(_identity);
    }
    if(!container){
        callback({status: code.not_found, msg: '容器错误'});
        return;
    }
    if(container.serverNO != _objInfo.serverNO){
        callback({status: code.other, msg: '服务器编号错误'});
        return;
    }


    var _object = objectHelper.createNameObject(_objInfo.classID);
    if(!_object){
        callback({status: code.other, msg: 'unknown object class'});
        return;
    }
    _object.load_from_json(_objInfo);

    objID.gen_object_id('collect_object', function (err, id) {
        if(err) return callback(err);
        _object.id = id;
        
        if (_identity) {
            dbCNOR.insert_relation(_identity.serverNO, _identity.classID, _identity.id, _object.serverNO, _object.classID, _object.id, function (err) {
                if(err){
                    callback(err);
                    return;
                }
                _object.insert_db(function (err) {
                    if(err){
                        callback(err);
                        return;
                    }

                    db.ramdb.cno.set_cno(_object);
                    db.ramdb.cnor.add_cnor({serverNO: _identity.serverNO, classID: _identity.classID, id: _identity.id, childServerNO: _object.serverNO, childClassID: _object.classID, childID: _object.id});
                    dbOPL.insert_user_log(ManagerAction.add_collect_object, req.user, '创建采集对象:' + _object.fullName, _object.gen_json_data(), new Date());

                    dbCNO.find_collect_object({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, results) {
                        if(err) {
                            logger.error({msg: 'try notify name object changed failed', obj: _object, err: err});
                            return;
                        }

                        var row = undefined;
                        if(results && results.length > 0){
                            row = results[0];
                        }
                        notifyHelper.send_notify(new NotifyMsg(NotifyType.collect_object_created, {container: _identity, object: row}));
                    });

                    callback(null, {serverNO: _object.serverNO, classID: _object.classID, id: _object.id});
                });
            });
        } else {
            _object.insert_db(callback);
        }
    });
}

module.exports.privilege = privilegePoint.addCollectDevice;
module.exports.cmd = cmd.mgr_0x00020001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        container: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            },
            required: true
        },
        object: {
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
                fullName: {
                    type: 'string',
                    required: true
                },
                description: {type: 'string'},
                restData: {type: 'object'}
            },
            required: true
        }
    }
};