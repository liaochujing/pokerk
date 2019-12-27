/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var uiclassID = require('../../../definition/uiClassID');
var AlarmAction = require('../../../modules/alarm/definition/alarm_action');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');
var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db');
// var dbSHL = db.datadb.shl;
var dbOPL = db.datadb.opl;

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

function handle(req, res, body, callback) {
    var user = req.user;

    if(body.classID < uiclassID.device && body.classID > uiclassID.lastDevice){
        callback({status: code.unknown, msg: 'only device can config alarm shield'});
        return;
    }
    var device = db.ramdb.no.get_by_identity(body);
    if(!device){
        callback({status: code.not_found, msg: 'device not found'});
        return;
    }

    var dbNO = db.no;

    var shield = body.shield;
    if(shield.start){
        shield.start = new Date(shield.start);
    }
    if(shield.end){
        shield.end = new Date(shield.end);
    }

    var time = new Date();
    dbNO.update({serverNO: body.serverNO, classID: body.classID, id: body.id}, {$set: {'restData.shield': shield, modifyTime: time}}, function (err) {
        if(err) return callback({status: code.unknown});

        device.shield = shield;

        if(shield.enabled){
            dbOPL.insert_user_log(AlarmAction.shield_device, user, '屏蔽设备：' + device.fullName + ' 告警', body, time);
        }else{
            dbOPL.insert_user_log(AlarmAction.shield_device, user, '取消屏蔽设备：' + device.fullName + ' 告警', body, time);
        }

        dbNO.find_nameobject({serverNO: body.serverNO, classID: body.classID, id: body.id}, {_id: 0}, function (err, results) {
            if(err) logger.error({msg: 'try notify name object changed failed', err: err});

            var row = undefined;
            if(results && results.length > 0){
                row = results[0];
            }

            if(row){
                notifyHelper.send_notify(new NotifyMsg(NotifyType.name_object_modified, {object: row}));
            }
        });

        callback();
    });
}

module.exports.privilege = PrivilegePoint.setAlarmConvergence;
module.exports.cmd = cmd.alm_0x00010009;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        shield: {
            type: 'object',
            properties: {
                enabled: {type: 'number', enum: [0, 1], required: true},
                start: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'},
                end: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'}
            },
            required: true
        }
    }
};