/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var PrivilegePoint = require('../../../definition/privilege_point');
var AlarmAction = require('../../../modules/alarm/definition/alarm_action');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var Condition = require('../../../definition/condition');
var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var user = req.user;

    var dbALP = db.alp;
    if(body.config){
        var config = body.config;
        if(config.hangup){
            if(config.hangup.start){
                config.hangup.start = new Date(config.hangup.start);
            }
            if(config.hangup.end){
                config.hangup.end = new Date(config.hangup.end);
            }
        }
        if(config.shield){
            if(config.shield.start){
                config.shield.start = new Date(config.shield.start);
            }
            if(config.shield.end){
                config.shield.end = new Date(config.shield.end);
            }
        }
    }

    var condition = body.condition;

    var type = condition.type;
    var genValue = condition.genValue || condition.value;
    var endValue = condition.endValue || condition.value;

    var conflict = false;
    switch(type){
        case Condition.lt:
            if(genValue > endValue){
                conflict = true;
            }
            break;
        case Condition.lte:
            if(genValue > endValue){
                conflict = true;
            }
            break;
        case Condition.eq:
            if(genValue != endValue){
                conflict = true;
            }
            break;
        case Condition.gte:
            if(genValue < endValue){
                conflict = true;
            }
            break;
        case Condition.gt:
            if(genValue < endValue){
                conflict = true;
            }
            break;
        case Condition.ne:
            if(genValue != endValue){
                conflict = true;
            }
            break;
        default:
            callback({status: code.unknown, msg: '未知判断符！'});
            return;
            break;
    }
    if(conflict){
        callback({status: code.unknown, msg: '告警条件冲突！'});
        return;
    }

    body.time = new Date();
    dbALP.upsert_alarm_type(body.id, body.name, body.condition, body.option, body.config, body.time, function (err) {
        if(err) callback(err);

        var _old = db.ramdb.alp.get_alarm_type(body.id);
        var _new = {id: body.id, name: body.name, condition: body.condition, option: body.option, config: body.config};
        db.ramdb.alp.set_alarm_type(_new);
        notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_type_changed, body));

        dbOPL.insert_user_log(AlarmAction.alarm_type_changed, user, '配置告警条件:' + body.name, {old: _old, new: _new}, new Date());

        callback();
    });
}

function get_privilege_point(body, done) {
    var _point = PrivilegePoint.addAlarmType;

    var alp = db.ramdb.alp.get_alarm_type(body.id);
    if(alp){
        _point = PrivilegePoint.modifyAlarmType;
    }

    done(null, _point);
}

module.exports.get_privilege_point = get_privilege_point;
module.exports.cmd = cmd.alm_0x00010003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        name: {type: 'string', required: true},
        condition: {
            type: 'object',
            properties: {
                type: {type: 'number', required: true},
                value: {type: 'number'},
                genValue: {type: 'number'},
                endValue: {type: 'number'}
            },
            required: true
        },
        option: {
            type: 'object',
            properties: {
                type: {type: 'number', required: true},
                level: {type: 'number', required: true},
                priority: {type: 'number', required: true},
                meaning: {type: 'string', required: true},
                startDelay: {type: 'number', required: true},
                endDelay: {type: 'number', required: true},
                mold: {type: 'number'}
            }
        },
        config: {
            shield: {
                enabled: {type: 'number', enum: [0,1], required: true},
                start: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'},
                end: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'}
            },
            hangup: {
                enabled: {type: 'number', enum: [0,1], required: true},
                start: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'},
                end: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}'}
            }
        }
    }
};