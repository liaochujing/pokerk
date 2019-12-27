/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var privilegePoint = require('../../../definition/privilege_point');

var AlarmAction = require('../../../modules/alarm/definition/alarm_action');
var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var user = req.user;

    var hangup = body.hangup;

    if(hangup.start){
        hangup.start = new Date(hangup.start);
    }
    if(hangup.end){
        hangup.end = new Date(hangup.end);
    }

    var dbDP = db.dp;
    var dbNO = db.no;
    
    dbDP.find_device_point({deviceServerNO: body.serverNO, deviceClassID: body.classID, deviceID: body.id, pointIndex: body.pointIndex}, {_id: 0, fullName: 1, config: 1, binding: 1, option: 1}, function (err, results) {
        if (err) {
            callback(err);
            return;
        }
        var _point = undefined;
        if (results && results.length > 0) {
            _point = results[0]
        } else {
            callback({status: code.not_found, msg: '设备点未找到'});
            return;
        }
        var config = _point.config;
        var dp_alarms = [];

        if(config.alarm){
            //旧告警数据不是数组则变成数组
            if(config.alarm != null && !Array.isArray(config.alarm)){
                dp_alarms.push(config.alarm);
            }else if(config.alarm != null){
                dp_alarms = config.alarm;
            }

            for(let i=0;i<dp_alarms.length;i++){
                let item = dp_alarms[i];
                if(body.alarm_type != null) {
                    if(item.id == body.alarm_type){
                        item.hangup = body.hangup;
                    }
                }else{
                    //type不存在则设置全部告警点
                    item.hangup = body.hangup;
                }
            }

            config.alarm = dp_alarms;
        }

        var time = new Date();
        dbNO.update_nameobject_time(body.serverNO, body.classID, body.id, time, function (err) {
            if(err) {
                logger.error({msg: 'device point config update modify device modify time failed', data: body});
                callback(err);
                return;
            }

            dbDP.update_devicepoint_config(body.serverNO, body.classID, body.id, body.pointIndex, _point.config, time, function (err) {
                if(err){
                    logger.error({msg: 'sync update point hangup failed', data: body});
                    callback(err);
                    return;
                }

                var rdbDP = db.ramdb.dp;
                if(rdbDP){
                    var point = rdbDP.get_point_sync(body.serverNO, body.classID, body.id, body.pointIndex);
                    if(point){
                        if(!point.config.alarm){
                            point.config.alarm = [];
                        }
                        let point_alarms = []; 
                        if(!Array.isArray(point.config.alarm)){
                            point_alarms.push(point.config.alarm);
                        }else{
                            point_alarms = point.config.alarm;
                        }

                        for(let i=0;i<point_alarms.length;i++){
                            let item = point_alarms[i];
                            if(body.alarm_type != null) {
                                if(item.id == body.alarm_type){
                                    item.hangup = hangup;
                                }
                            }else{
                                item.hangup = hangup;
                            }
                        }
                        point.config.alarm = point_alarms;
                    }
                }

                notifyHelper.send_notify(new NotifyMsg(NotifyType.device_point_modified, {serverNO: body.serverNO, classID: body.classID, id: body.id, points: [{pointIndex: body.pointIndex, config: _point.config, binding: _point.binding, option: _point.option, time: time}], time: time}));
                dbOPL.insert_user_log(AlarmAction.hangup_point, user, '挂起设备点:' + _point.fullName + ' 告警', body, new Date());

                callback();
            });
        });
    });
}

module.exports.privilege = privilegePoint.hangupPoint;
module.exports.cmd = cmd.alm_0x00010001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        pointIndex: {type: 'number', required: true},
        alarm_type: {type: 'number'},
        hangup: {
            type: 'object',
            properties: {
                enabled: {type: 'number', enum: [0,1], required: true},
                start: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'},
                end: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'}
            },
            required: true
        }
    }
};