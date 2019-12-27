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

var Notification = require('../../../helpers/notification_helper');
var Emitter = Notification.Emitter;

//TODO: 拆分成collection
function handle(req, res, body, callback) {
    var dbCFG = db.cfg;
    var key = sysConfigKey.alarm_notify_rule_config;

    var config = db.ramdb.cfg.get_system_config(key);
    if(config){
        if(!Array.isArray(config)){
            config = [];
        }
    }else{
        config = [];
    }

    let community = undefined;//人员所属社区id
    var user = req.user;
    if(!body.community){
        var _user = db.ramdb.oo.get_by_identity(user);
        if(_user){
            community = _user.community;
            body.community = community;
        }
    }else{
        community = body.community;
    }

    if(config.length > 0){
        var is_exists = false;
        for(let i=0;i<config.length;i++){
            let item = config[i];
            if(community != null && community == item.community){
                config[i] = body;
                is_exists = true;
                break;
            }else if(community == null && item.community == null){
                config[i] = body;
                is_exists = true;
                break;
            }
        }
        if(!is_exists){
            config.push(body);
        }
    }else{
        config.push(body);
    }
    var dbAAC = db.areaAlarmConfig;
    var _area = db.ramdb.no.get_no_sync(0,0,community);
    var id = 0;
    var classID = 0;
    var serverNO = 0;
    if (_area){
        id = _area.id;
        classID = _area.classID;
        serverNO = _area.serverNO;
    }
    dbAAC.upsert_alarm_config({serverNO:id,classID:classID,id: id}, {alarm_notify_rule_config:body}, function (err) {
        if(err) return callback(err);

        db.ramdb.cfg.set_system_config(key, config);
        dbOPL.insert_user_log(AlarmAction.alarm_notify_config, req.user, '修改告警通知规则配置', req.body, new Date());
        Notification.emit(Emitter.config, 'xh_alarm_message_notify_plug_in', body);
        callback();
    })
    // dbCFG.update_system_config(svrType, key, config, function (err) {
    //     if(err) return callback(err);
    //
    //     db.ramdb.cfg.set_system_config(key, config);
    //
    //
    //     callback();
    // })
}

module.exports.privilege = privilegePoint.setAlarmNotify;
module.exports.cmd = cmd.alm_0x00010017;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        option: {
            type: 'object',
            properties: {
                format: {type: 'string', required: true},
                retry: {type: 'number', required: true},
                retryInterval: {type: 'number', required: true},
                endNotify: {type: 'number'}
            },
            required: true
        },
        region: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            },
            required: true
        },
        deviceClassID: {type: 'array', items: {type: 'number'}},
        alarmClassID: {type: 'array', items: {type: 'number'}},
        modelist: {
            type: 'array', 
            items: {
                type: 'object',
                properties: {
                    mode: {type: 'number', required: true},
                    enable: {type: 'number', required: true},
                    list: {type: 'array', items: {type: 'string'}}
                }
            }, 
            required: true
        },
        third_party: {//第三方通知
            type: 'object',
            properties: {
                url: {type: 'string', required: true},
                target_phone: {type: 'string', required: true}
            },
            required: true
        },
        community: {type: 'integer'}
    },
    required: true
};