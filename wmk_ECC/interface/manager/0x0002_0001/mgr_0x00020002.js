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
    var _object = db.ramdb.cno.get_by_identity(body);
    if(_object){
        var _guid = undefined;
        if(body.restData){
            _guid = body.restData.guid;
        }
        if(_guid){
            var collectors = db.ramdb.cno.get_cno_by_class(uiclassID.collector, _object.serverNO);
            for(var i=0;i<collectors.length;i++){
                var _c = collectors[i];
                if(_c != _object && _c.guid == _guid){
                    callback({status: code.unknown, msg: 'guid重复'});
                    return;
                }
            }
        }

        var now = new Date();
        var dbCNO = db.cno;

        var setpro = {};
        if(body.fullName !== undefined){
            setpro.fullName = body.fullName;
        }
        if(body.description !== undefined){
            setpro.description = body.description;
        }
        if(body.restData){
            for(var i in body.restData){
                setpro['restData.' + i] = body.restData[i];
            }
        }
        setpro.modifyTime = now;

        dbCNO.update({serverNO: body.serverNO, classID: body.classID, id: body.id}, {$set: setpro}, function (err) {
            if(err) return callback({status: code.unknown});

            dbCNO.find_collect_object({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, results) {
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

                    notifyHelper.send_notify(new NotifyMsg(NotifyType.collect_object_modified, {object: row}));
                    dbOPL.insert_user_log(ManagerAction.modify_collect_object, req.user, '修改采集对象:' + _object.fullName, _object.gen_json_data(), new Date());
                }
            });

            callback();
        });
    }else{
        callback({status: code.not_found, msg: 'object not found'});
    }
}

module.exports.privilege = privilegePoint.modifyCollectDevice;
module.exports.cmd = cmd.mgr_0x00020002;
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
        description: {type: 'string'},
        restData: {type: 'object'}
    }
};