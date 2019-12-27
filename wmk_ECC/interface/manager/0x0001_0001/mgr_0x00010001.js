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

    var obj = db.ramdb.no.get_by_identity(_identity);
    if(_identity.classID != 0 && !obj){
        callback({status: code.not_found, msg: '容器错误'});
        return;
    }

    var _object = objectHelper.createNameObject(_objInfo.classID);
    if(!_object){
        callback({status: code.other, msg: '未知类型对象'});
        return;
    }
    _object.load_from_json(_objInfo);

    if(_object.classID == uiclassID.building){
        if(body.object.serverNO == 0){
            callback({status: code.other, msg: '楼栋编号错误'});
            return;
        }
        var buildings = db.ramdb.no.get_by_class(uiclassID.building);
        if(buildings){
            for(var i=0;i<buildings.length;i++){
                var _b = buildings[i];
                if(_b.serverNO == _object.serverNO){
                    callback({status: code.other, msg: '楼栋编号重复'});
                    return;
                }
                if(_b.host == _object.host && _b.port == _object.port){
                    callback({status: code.other, msg: '楼栋IP和端口不可重复'});
                    return;
                }
            }
        }
    }
    // if(body.container.classID > uiclassID.lastArea){
    //     callback({status: code.other, msg: '该对象下，不可添加子对象'});
    //     return;
    // }

    var dbNO = db.no;
    var dbNOR = db.nor;
    var objID = db.objID;

    function get_object_id(done) {
        if(_objInfo.id != undefined && _objInfo.id > 0){
            var _temp = db.ramdb.no.get_no_sync(_objInfo.serverNO, _objInfo.classID, _objInfo.id);
            if(_temp){
                return done({status: code.other, msg: 'ID重复'});
            }else{
                done(null, _objInfo.id);
            }
        }else{
            objID.gen_object_id('nameobject', function (err, id) {
                if(err) return done(err);
                done(null, id);
            });
        }
    }
    
    var now = new Date();
    get_object_id(function (err, id) {
        if(err) return callback(err);
        _object.id = id;
        _object.modifyTime = now;
        _object.createTime = now;

        dbNOR.insert_relation(_identity.serverNO, _identity.classID, _identity.id, _object.serverNO, _object.classID, _object.id, function (err) {
            if(err){
                callback(err);
                return;
            }
            _object.insert_db(function (err) {
                if(err){
                    callback(err);
                    return;
                }

                db.ramdb.no.set_no(_object);
                db.ramdb.nor.add_nor({serverNO: _identity.serverNO, classID: _identity.classID, id: _identity.id, childServerNO: _object.serverNO, childClassID: _object.classID, childID: _object.id});
                dbOPL.insert_user_log(ManagerAction.add_object, req.user, '创建对象:' + _object.fullName, _object.gen_json_data(), new Date());

                dbNO.find_nameobject({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, results) {
                    if(err) {
                        logger.error({msg: 'try notify name object changed failed', obj: _object, err: err});
                        return;
                    }

                    if(results && results.length > 0){
                        notifyHelper.send_notify(new NotifyMsg(NotifyType.name_object_created, {container: _identity, object: results[0]}));
                    }

                    if(_object.classID >= uiclassID.device && _object.classID <= uiclassID.lastDevice){
                        _object.gen_point_list(null, function (err) {
                            if(err) {
                                logger.error({msg: 'gen device point list failed', err: err});
                                return;
                            }

                            notifyHelper.send_notify(new NotifyMsg(NotifyType.device_point_modified, {serverNO: _object.serverNO, classID: _object.classID, id: _object.id, reload: 1, type: _object.type, time: now}));
                        });
                    }

                    callback(null, {serverNO: _object.serverNO, classID: _object.classID, id: _object.id});
                });
            });
        });
    });
}

module.exports.cmd = cmd.mgr_0x00010001;
module.exports.privilege = privilegePoint.addObject;
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
                id: {type: 'number'},
                fullName: {
                    type: 'string',
                    required: true
                },
                name: {
                    type: 'string'
                },
                description: {type: 'string'},
                restData: {type: 'object'}
            },
            required: true
        }
    }
};