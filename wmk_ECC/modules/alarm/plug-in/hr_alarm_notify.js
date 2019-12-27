/**
 * Created by wangxh on 2019/3/19.
 */

'use strict';

var logger = require('../../../util/log_manager').logger;
var Notification = require('../../../helpers/notification_helper');
var Emitter = Notification.Emitter;

var device_helper = require('../../../helpers/device_helper');
var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var alarm_level = require('../../../definition/alarm_level');
var request = require('request');

var db = require('../../../db');
var rdbALP = db.ramdb.alp;
var rdbNO = db.ramdb.no;

var _url = undefined;

function run() {
    function load_config(config) {
        if(config != undefined){
            _url = config.url;
        }else{
            _url = undefined;
        }
    }
    logger.info("华润推送开启");
    var config = db.ramdb.cfg.get_system_config(sysConfigKey.hr_alarm_notify_plug_in);
    load_config(config);

    Notification.on(Emitter.config, 'hr_alarm_notify_plug_in', function (config) {
        load_config(config)
    });
    Notification.on(Emitter.alarm, 'start', function (alarm) {
        logger.info({msg: '推送告警', url: _url});
        if(_url != undefined){
            let _event = undefined;
            let _type = rdbALP.get_alarm_type(alarm.classID);
            if(_type != undefined && _type.option){
                _event = _type.option.event_type
            }else{
                _event = ''
            }
            let _source = undefined;
            let device = rdbNO.get_by_identity(alarm.source);
            if(device != undefined){
                _source = device.fullName
            }else{
                _source = '未知'
            }

            let eventId = '';
            if(alarm.open_id != null) {
                eventId = alarm.open_id;
            }else if(alarm.third_party_id != null) {
                eventId = alarm.third_party_id;
            }else{
                logger.info(alarm);
            }

            let path = device_helper.get_device_path(alarm.source);

            let post_data = {
                Summary: '[' + path + '][' + _type.name + '][告警产生]',
                Notes: '时间:' + alarm.startTime.format_datetime() +'\n' +
                '事件分类:' + _event + '\n' +
                '告警描述:' + alarm.desc + '\n' +
                '受派组:集团总部-基础设施运维-机电运维组',
                Alert_type: _event,
                Event_id: eventId,
                IP: _source,
                Priority: get_alarmLevel(alarm.level),
                Source: '深圳前置机房动环监控',
                Assignee: ''
            }
            logger.info(post_data);

            request.post(_url, {
                body: post_data,
                json: true
            }, function (err, res, body) {
                if(err) {
                    logger.error({msg: 'hr alarm start notify failed', err: err});
                }else{
                    logger.info(body);
                }
            });
        }
    });
    Notification.on(Emitter.alarm, 'end', function (alarm) {
        logger.info({msg: '推送告警', url: _url});
        if(_url != undefined){
            let _event = undefined;
            let _type = rdbALP.get_alarm_type(alarm.classID);
            if(_type != undefined && _type.option){
                _event = _type.option.event_type
            }else{
                _event = ''
            }
            let _source = undefined;
            let device = rdbNO.get_by_identity(alarm.source);
            if(device != undefined){
                _source = device.fullName
            }else{
                _source = '未知'
            }

            let eventId = '';
            if(alarm.open_id != null) {
                eventId = alarm.open_id;
            }else if(alarm.third_party_id != null) {
                eventId = alarm.third_party_id;
            }else{
                logger.info(alarm);
            }

            let path = device_helper.get_device_path(alarm.source);

            let post_data = {
                Summary: '[' + path + '][' + _type.name + '][告警恢复]',
                Notes: '时间:' + alarm.startTime.format_datetime() +'\n' +
                '事件分类:' + _event + '\n' +
                '告警描述:' + alarm.desc + '\n' +
                '受派组:集团总部-基础设施运维-机电运维组',
                Alert_type: _event,
                Event_id: eventId,
                IP: _source,
                Priority: get_alarmLevel(alarm.level),
                Source: '深圳前置机房动环监控',
                Assignee: ''
            }
            logger.info(post_data);

            request.post(_url, {
                body: post_data,
                json: true
            }, function (err, res, body) {
                if(err) {
                    logger.error({msg: 'hr alarm start notify failed', err: err});
                }else{
                    logger.info(body);
                }
            });
        }
    });
}

//对应等级
function get_alarmLevel(level) {
    if(level >= alarm_level.important){
        return '三级';
    }

    return '四级';
}

module.exports.run = run;