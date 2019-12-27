/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var privilegePoint = require('../../../definition/privilege_point');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var _object = db.ramdb.no.get_no_sync(body.serverNO, body.classID, body.id);
    if(_object){
        if(_object.classID == uiclassID.building){
            var buildings = db.ramdb.no.get_by_class(uiclassID.building);
            if(buildings){
                for(var i=0;i<buildings.length;i++){
                    var _b = buildings[i];
                    if(_b.serverNO != _object.serverNO && _b.host == body.restData.host && _b.port == body.restData.port){
                        callback({status: code.other, msg: '楼栋IP和端口不可重复'});
                        return;
                    }
                }
            }
        }

        var now = new Date();
        var dbNO = db.no;

        var setpro = {};
        if(body.fullName !== undefined){
            setpro.fullName = body.fullName;
        }
        if(body.name !== undefined){
            setpro.name = body.name;
        }
        if(body.description !== undefined){
            setpro.description = body.description;
        }
        if(body.restData != undefined){
            for(var i in body.restData){
                setpro['restData.' + i] = body.restData[i];
            }
        }
        setpro.modifyTime = now;

        var shouldReGenPoint = false;
        if(_object.classID >= uiclassID.device && _object.classID <= uiclassID.lastDevice){
            var type = undefined;
            if(body.restData && body.restData['type']){
                type = body.restData['type'];
            }
            if(type){
                var _type = _object.type || {};
                if(type.system != _type.system || type.group != _type.group || type.id != _type.id){
                    shouldReGenPoint = true;
                }
            }
        }

        dbNO.update({serverNO: body.serverNO, classID: body.classID, id: body.id}, {$set: setpro}, function (err) {
            if(err) return callback({status: code.unknown});

            dbNO.find_nameobject({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, results) {
                if(err) {
                    logger.error({msg: 'try notify name object changed failed', obj: _object, err: err});
                    return;
                }

                var row = undefined;
                if(results && results.length > 0){
                    row = results[0];
                }
                if(row){
                    _object.load_from_json(row);
                    notifyHelper.send_notify(new NotifyMsg(NotifyType.name_object_modified, {object: row}));
                    dbOPL.insert_user_log(ManagerAction.modify_object, req.user, '修改对象:' + _object.fullName, _object.gen_json_data(), new Date());
                    
                    if(shouldReGenPoint){
                        _object.regen_point_list(null, function (err) {
                            if(err){
                                logger.error({msg: 'update device regen point list failed', err: err});
                                return;
                            }
                            notifyHelper.send_notify(new NotifyMsg(NotifyType.device_point_modified, {serverNO: _object.serverNO, classID: _object.classID, id: _object.id, reload: 1, type: _object.type, time: now}));
                        });
                    }
                }
            });

            callback();
        });
    }else{
        callback({status: code.not_found, msg: 'object not found'});
    }
}

module.exports.cmd = cmd.mgr_0x00010002;
module.exports.privilege = privilegePoint.modifyObject;
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
        },
        fullName: {type: 'string'},
        name: {type: 'string'},
        description: {type: 'string'},
        restData: {type: 'object'}
    }
};