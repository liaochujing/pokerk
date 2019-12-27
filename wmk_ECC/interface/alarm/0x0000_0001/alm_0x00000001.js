/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var alarmLevel = require('../../../definition/alarm_level');
var alarmHelper = require('../../../modules/alarm/processor/alarm_helper');
var privilegePoint = require('../../../definition/privilege_point');

var AlarmAction = require('../../../modules/alarm/definition/alarm_action');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');

var db = require('../../../db');
var dbAML = db.datadb.aml;

function handle(req, res, body, callback) {
    var user = req.user;

    var option = body.option || {};
    option.user = user.id;//确认人

    if(body.serverNO == defaultServerNO){
        alarmHelper.confirm_alarm(body.serverNO, body.classID, body.id, option, function (err) {
            if(err) return callback({status: code.unknown});

            dbAML.insert_log(body.serverNO, body.classID, body.id, user.id, AlarmAction.confirm_alarm, option, new Date(), function (err) {
                if(err) logger.error({msg: 'insert alarm action log failed', user: user, action: AlarmAction.confirm_alarm});
            });

            callback(null, {isConfirmed: 1, confirmed: option})
        })
    }else{
        var msg = new DataMessage(CentralCMD.cen_0x00020003, body);
        dataHelper.send(msg, function (err, data) {
            if(err){
                return callback({status: code.unknown, msg: err.msg});
            }

            dbAML.insert_log(body.serverNO, body.classID, body.id, user.id, AlarmAction.confirm_alarm, option, new Date(), function (err) {
                if(err) logger.error({msg: 'insert alarm action log failed', user: user, action: AlarmAction.confirm_alarm});
            });

            callback(null, data);
        });
    }
}

function get_privilege_point(body, done) {
    db.alarm.find_alarm({serverNO: body.serverNO, classID: body.classID, id: body.id}, {_id: 1, level: 1}, function (err, result) {
        if(err) return done(err);

        var alarm = undefined;
        if(result && result.length > 0){
            alarm = result[0];
        }

        var _point = undefined;
        if(alarm){
            switch(alarm.level){
                case alarmLevel.notice:
                    _point = privilegePoint.confirmNoticeAlarm;
                    break;
                case alarmLevel.normal:
                    _point = privilegePoint.confirmNormalAlarm;
                    break;
                case alarmLevel.important:
                    _point = privilegePoint.confirmImportantAlarm;
                    break;
                case alarmLevel.urgent:
                    _point = privilegePoint.confirmUrgentAlarm;
                    break;
            }

            done(null, _point);
        }else{
            done({status: code.not_found, msg: 'alarm not found'});
        }
    });
}

module.exports.cmd = cmd.alm_0x00000001;
module.exports.get_privilege_point = get_privilege_point;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        option: {
            type: 'object',
            required: true
        }
    }
};