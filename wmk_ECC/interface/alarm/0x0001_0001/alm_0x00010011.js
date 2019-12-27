/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var AlarmAction = require('../../../modules/alarm/definition/alarm_action');
var privilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbAAC = db.areaAlarmConfig;
    var serverNO = body.serverNO || 0;
    var classID = body.classID || 0;
    var id = body.id || 0 ;
    // body.community = id;
    dbAAC.upsert_alarm_config({serverNO:serverNO, classID:classID,id: id}, {alarm_notify_config:body}, function (err) {
        if(err) return callback(err);
        // db.ramdb.cfg.set_system_config(sysConfigKey.alarm_notify_config, body['notify_upgrade_list']);   //待添加并增加key 或增加新缓存项
        // db.ramdb.cfg.set_area_system_config(sysConfigKey.alarm_notify_config, id,body);
        db.ramdb.cfg.set_system_config(sysConfigKey.alarm_notify_config, body);
        //TODO 如果有传入id生成区域config，缓存中的配置和使用处的判断需添加,000为配置全局
        dbOPL.insert_user_log(AlarmAction.alarm_notify_config, req.user, '修改告警通知配置', req.body, new Date());
        callback();
    });  //前端需要发送serverNO classID id
}


module.exports.privilege = privilegePoint.setAlarmNotify;
module.exports.cmd = cmd.alm_0x00010011;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            alarmClassID: {
                type: 'array',
                items: {type: 'number'},
                required: true
            },
            leader: {
                type: 'object',
                properties: {
                    id: {type: 'number', required: true},
                    timeout: {type: 'number', required: true}
                },
                required: true
            },
            director: {
                type: 'object',
                properties: {
                    id: {type: 'number', required: true},
                    timeout: {type: 'number', required: true}
                },
                required: true
            },
            inspector: {
                type: 'object',
                properties: {
                    id: {type: 'number', required: true},
                    timeout: {type: 'number', required: true}
                },
                required: true
            }
        }
    },
    required: true
};