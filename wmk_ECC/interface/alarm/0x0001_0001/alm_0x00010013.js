/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var privilegePoint = require('../../../definition/privilege_point');
var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var AlarmAction = require('../../../modules/alarm/definition/alarm_action');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {

    var dbAAC = db.areaAlarmConfig;
    var serverNO = body.serverNO || 0;
    var classID = body.classID || 0;
    var id = body.id || 0 ;
    dbAAC.upsert_alarm_config({serverNO:serverNO, classID:classID,id: id}, {schedule_alarm_config:{time:body.time,list:body.list}}, function (err) {
        if(err) return callback(err);
        db.ramdb.cfg.set_system_config(sysConfigKey.schedule_alarm_config,{time:body.time,list:body.list});
        // db.ramdb.cfg.set_system_config(sysConfigKey.schedule_alarm_config, body);
        dbOPL.insert_user_log(AlarmAction.schedule_notify_config, req.user, '修改定时通知配置', req.body, new Date());
        callback();
    })
}

module.exports.privilege = privilegePoint.setAlarmNotify;
module.exports.cmd = cmd.alm_0x00010013;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        time: {type: 'array', items: {type: 'number'}, required: true},
        list: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    user: {type: 'number', required: true},
                    state: {type: 'number', required: true},
                    points: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                serverNO: {type: 'number', required: true},
                                classID: {type: 'number', required: true},
                                id: {type: 'number', required: true},
                                pointIndex: {type: 'number', required: true}
                            }
                        },
                        required: true
                    }
                }
            },
            required: true
        }
    },
    required: true
};