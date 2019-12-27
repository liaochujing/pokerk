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

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db');
var dbAML = db.datadb.aml;
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var user = req.user;
    var option = body.option || {};
    option.user = user.id;//挂起人

    if(body.serverNO == defaultServerNO){
        alarmHelper.unhangup_alarm(body.serverNO, body.classID, body.id, option, function (err) {
            if(err) return callback({status: code.unknown});

            dbAML.insert_log(body.serverNO, body.classID, body.id, user.id, AlarmAction.unhangup_alarm, option, new Date(), function (err) {
                if(err) logger.error({msg: 'insert alarm action log failed', user: user, action: AlarmAction.unhangup_alarm});
            });

            callback()
        })
    }else{
        var get_alarm_info = function (done) {
            if(!body.source){
                db.alarm.find_alarm({serverNO: body.serverNO, classID: body.classID, id: body.id}, {_id: 1, source: 1, level: 1}, function (err, result) {
                    if (err) return done(err);

                    var alarm = undefined;
                    if (result && result.length > 0) {
                        alarm = result[0];
                    }

                    var _point = undefined;
                    if (alarm) {
                        body.source = alarm.source;
                        done();
                    }else{
                        done({msg: 'alarm not found'})
                    }
                });
            }else{
                done();
            }
        };

        var hangup_point = function () {
            var source = body.source;
            var hangup = {enabled: 0};

            var dbDP = db.dp;
            var dbNO = db.no;

            dbDP.find_device_point({deviceServerNO: source.serverNO, deviceClassID: source.classID, deviceID: source.id, pointIndex: source.pointIndex}, {_id: 0, fullName: 1, config: 1, binding: 1, option: 1}, function (err, results) {
                if (err) {
                    logger.error(err);
                    return;
                }
                var _point = undefined;
                if (results && results.length > 0) {
                    _point = results[0];
                } else {
                    return;
                }
                var config = _point.config;
                if(config.alarm && config.alarm.length > 0){
                    for(let i=0;i<config.alarm.length;i++){
                        let item = config.alarm[i];
                        if(item.id == body.classID){
                            item.hangup = hangup;
                            break;
                        }
                    }
                }

                var time = new Date();
                dbNO.update_nameobject_time(source.serverNO, source.classID, source.id, time, function (err) {
                    if(err) {
                        logger.error({msg: 'device point config update modify device modify time failed', data: source});
                        return;
                    }

                    dbDP.update_devicepoint_config(source.serverNO, source.classID, source.id, source.pointIndex, config, time, function (err) {
                        if(err){
                            logger.error({msg: 'sync update point hangup failed', data: source});
                            return;
                        }

                        var rdbDP = db.ramdb.dp;
                        if(rdbDP){
                            var point = rdbDP.get_point_sync(source.serverNO, source.classID, source.id, source.pointIndex);
                            if(point){
                                if(!point.config.alarm){
                                    point.config.alarm = {};
                                }
                                point.config.alarm.hangup = hangup;
                            }
                        }

                        notifyHelper.send_notify(new NotifyMsg(NotifyType.device_point_modified, {serverNO: source.serverNO, classID: source.classID, id: source.id, points: [{pointIndex: source.pointIndex, config: _point.config, binding: _point.binding, option: _point.option, time: time}], time: time}));
                        dbOPL.insert_user_log(AlarmAction.hangup_point, user, '解挂设备点:' + _point.fullName, {serverNO: source.serverNO, classID: source.classID, id: source.id, pointIndex: source.pointIndex, hangup: hangup}, new Date());
                    });
                });
            });
        };

        var msg = new DataMessage(CentralCMD.cen_0x00020008, body);
        dataHelper.send(msg, function (err, data) {
            if(err){
                return callback({status: code.unknown, msg: err.msg});
            }

            dbAML.insert_log(body.serverNO, body.classID, body.id, user.id, AlarmAction.unhangup_alarm, option, new Date(), function (err) {
                if(err) logger.error({msg: 'insert alarm action log failed', user: user, action: AlarmAction.unhangup_alarm});
            });

            get_alarm_info(function (err) {
                if(err) {
                    logger.error(err);
                    return;
                }
                hangup_point();
            });

            callback();
        });
    }
}

function get_privilege_point(body, done) {
    db.alarm.find_alarm({serverNO: body.serverNO, classID: body.classID, id: body.id}, {_id: 1, source: 1, level: 1}, function (err, result) {
        if(err) return done(err);

        var alarm = undefined;
        if(result && result.length > 0){
            alarm = result[0];
        }

        var _point = undefined;
        if(alarm){
            body.source = alarm.source;
            switch(alarm.level){
                case alarmLevel.notice:
                    _point = privilegePoint.hangupNoticeAlarm;
                    break;
                case alarmLevel.normal:
                    _point = privilegePoint.hangupNormalAlarm;
                    break;
                case alarmLevel.important:
                    _point = privilegePoint.hangupImportantAlarm;
                    break;
                case alarmLevel.urgent:
                    _point = privilegePoint.hangupUrgentAlarm;
                    break;
            }

            done(null, _point);
        }else{
            done({status: code.not_found, msg: 'alarm not found'});
        }
    });
}

module.exports.cmd = cmd.alm_0x00000004;
module.exports.get_privilege_point = get_privilege_point;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        option: {type: 'object'}
    }
};