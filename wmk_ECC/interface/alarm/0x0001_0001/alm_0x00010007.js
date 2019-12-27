/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var AlarmAction = require('../../../modules/alarm/definition/alarm_action');
var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var user = req.user;

    var dbDP = db.dp;
    var dbNO = db.no;

    dbDP.find_device_point({deviceServerNO: body.serverNO, deviceClassID: body.classID, deviceID: body.id, pointIndex: body.pointIndex}, {_id: 0, fullName: 1, config: 1, binding: 1, option: 1}, function (err, results) {
        if(err){
            callback(err);
            return;
        }

        var _point = undefined;
        if(results && results.length > 0){
            _point = results[0]
        }else{
            callback({status: code.not_found, msg: '设备点未找到'});
            return;
        }

        var config = undefined;
        config = _point.config || {};
        if(config.alarm && config.alarm.length > 0){
            if(body.convergence){
                for(let j=0;j<config.alarm.length;j++){
                    let _alarm = config.alarm[j];
                    let need_delete = true;

                    for(let i=0;i<body.convergence.length;i++){
                        let _convergence = body.convergence[i];
                        if(_alarm.id == _convergence.alarm_type){
                            _alarm.convergence = _convergence;
                            need_delete = false;
                            break;
                        }
                    }

                    if(need_delete){
                        delete _alarm.convergence;
                    }
                }
            }else{
                for(let j=0;j<config.alarm.length;j++){
                    let _alarm = config.alarm[j];
                    delete _alarm.convergence;
                }
            }
        }

        var time = new Date();
        dbNO.update_nameobject_time(body.serverNO, body.classID, body.id, time, function (err) {
            if (err) {
                logger.error({msg: 'device point config update modify device modify time failed', data: body});
                callback(err);
                return;
            }

            dbDP.update_devicepoint_config(body.serverNO, body.classID, body.id, body.pointIndex, _point.config, time, function (err) {
                if(err){
                    logger.error({msg: 'sync update point hangup failed', data: body});
                    callback();
                    return;
                }

                var rdbDP = db.ramdb.dp;
                if(rdbDP){
                    var point = rdbDP.get_point_sync(body.serverNO, body.classID, body.id, body.pointIndex);
                    if(point){
                        let _config = point.config;
                        if(_config.alarm && _config.alarm.length > 0){
                            if(body.convergence){
                                for(let j=0;j<_config.alarm.length;j++){
                                    let _alarm = _config.alarm[j];
                                    let need_delete = true;
                
                                    for(let i=0;i<body.convergence.length;i++){
                                        let _convergence = body.convergence[i];
                                        if(_alarm.id == _convergence.alarm_type){
                                            _alarm.convergence = _convergence;
                                            need_delete = false;
                                            break;
                                        }
                                    }
                
                                    if(need_delete){
                                        delete _alarm.convergence;
                                    }
                                }
                            }else{
                                for(let j=0;j<_config.alarm.length;j++){
                                    let _alarm = _config.alarm[j];
                                    delete _alarm.convergence;
                                }
                            }
                        }
                    }
                }

                notifyHelper.send_notify(new NotifyMsg(NotifyType.device_point_modified, {serverNO: body.serverNO, classID: body.classID, id: body.id, points: [{pointIndex: body.pointIndex, config: _point.config, binding: _point.binding, option: _point.option, time: time}], time: time}));
                var device = db.ramdb.no.get_by_identity(req.body);
                if(device){
                    if(body.convergence){
                        dbOPL.insert_user_log(AlarmAction.alarm_convergence, user, '配置设备:' + device.fullName + ' 设备点:' + _point.fullName + ' 告警过滤', body, new Date());
                    }else{
                        dbOPL.insert_user_log(AlarmAction.alarm_convergence, user, '删除设备:' + device.fullName + ' 设备点:' + _point.fullName + ' 告警过滤', body, new Date());
                    }
                }

                callback();
            });
        });
    });
}

module.exports.privilege = PrivilegePoint.setAlarmShield;
module.exports.cmd = cmd.alm_0x00010007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        pointIndex: {type: 'number', required: true},
        convergence: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    alarm_type: {type: 'number', required: true},
                    source: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                serverNO: {type: 'number', required: true},
                                classID: {type: 'number', required: true},
                                id: {type: 'number', required: true}
                            }
                        },
                        required: true
                    },
                    types: {
                        type: 'array',
                        items: {type: 'number'},
                        required: true
                    },
                    interval: {type: 'number', required: true}
                }
            }
        }
    }
};