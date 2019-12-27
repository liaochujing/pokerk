/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var privilegePoint = require('../../../definition/privilege_point');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var OperatorAction = require('../../../modules/user/definition/operator_action');

var db = require('../../../db/index');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var _object = db.ramdb.oo.get_operator_group(body);
    if(_object){
        var now = new Date();
        var dbOO = db.oo;

        var setpro = {modifyTime: now};
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
        dbOO.update({serverNO: body.serverNO, classID: body.classID, id: body.id}, {$set: setpro}, function (err) {
            if(err) return callback({status: code.unknown});
            
            // notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_modified, {identity: {serverNO: _object.serverNO, classID: _object.classID, id: _object.id}}));
            dbOO.find_operator_object({serverNO: _object.serverNO, classID: _object.classID, id: _object.id}, {_id: 0}, function (err, results) {
                if(err) {
                    logger.error({msg: 'try notify operator object changed failed', obj: _object, err: err});
                    return;
                }

                if(results && results.length > 0){
                    var row = results[0];

                    _object.load_from_json(row);

                    notifyHelper.send_notify(new NotifyMsg(NotifyType.operator_object_modified, {object: row}));

                    dbOPL.insert_user_log(OperatorAction.modify_user, req.user, '修改人员组:' + _object.fullName, _object.gen_json_data(), new Date());
                }
            });

            callback();
        });
    }else{
        callback({status: code.not_found, msg: 'object not found'});
    }
}

module.exports.privilege = privilegePoint.modifyOperatorGroup;
module.exports.cmd = cmd.usr_0x00000002;
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