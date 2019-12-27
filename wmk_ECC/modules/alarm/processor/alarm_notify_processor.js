/**
 * Created by wangxh on 2018/4/8.
 */

'use strict';

var util = require('util');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;

var Notification = require('../../../helpers/notification_helper');
var Emitter = Notification.Emitter;

var uiclassID = require('../../../definition/uiClassID');
var NoticeType = require('../../../definition/notice_type');
var sysConfigKey = require('../definition/system_config_key');
var AlarmLevel = require('../../../definition/alarm_level');
var Condition = require('../../../definition/condition');

var db = require('../../../db');
var dbAlarm = db.alarm;
var rdbAlarm = db.ramdb.alarm;
var rdbCFG = db.ramdb.cfg;
var rdbOO = db.ramdb.oo;
var rdbNO = db.ramdb.no;
var rdbNOR = db.ramdb.nor;
var ramdb = db.ramdb;

var check_interval = 5 * 1000; //5s检查一次

// var config = [
//     {
//         alarmClassID: [1000, 1001],
//         leader: {//组长
//             id: 1,
//             timeout: 100
//         },
//         director: {//主管
//             id: 2,
//             timeout: 200
//         },
//         inspector: {//总监
//             id: 3,
//             timeout: 300
//         }
//     }
// ];

const _notice_type = NoticeType.message;//1：钉钉，2：邮件，3：短信
var msgHelper = require('../../../helpers/message_helper');


function get_recipient(contact) {
    switch(_notice_type){
        case NoticeType.dingding:
            return contact.dd;
        case NoticeType.email:
            return contact.email;
        case NoticeType.message:
        case NoticeType.tel:
            return contact.tel;
        default:
            return undefined;
    }
}

function notify(notifyList, time) {
    var _updateAlarm = [];
    var _sendNotify = [];
    for(var i=0;i<notifyList.length;i++){
        var _item = notifyList[i];

        var alarm = _item.alarm;
        var key = _item.key;
        var option = {user: _item.user, time: time};
        if(!alarm.notify){
            alarm.notify = {};
        }
        var _notify = alarm.notify;
        
        //更新数据库后变更
        // _notify[key] = option;

        _sendNotify.push({serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id, desc: alarm.desc, startTime: alarm.startTime, user: _item.user, key: key, notify: _notify, option: option});
    }
    ah.each_series(_sendNotify, function (item, cbItem) {
        var recipient = undefined;
        var operator = rdbOO.get_operator_by_id(item.user);
        if(operator && operator.contact){
            recipient = get_recipient(operator.contact);
        }
        if(recipient){
            //TODO: 发送通知
            ah.retry({times: 3, interval: 300}, function (cb) {
                msgHelper.send_message(_notice_type, recipient, '告警通知', util.format('[%s]%s', item.startTime.format_datetime(), item.desc), function (err) {
                    cb(err);
                })
            }, function (err) {
                if(err) return cbItem(err);
                _updateAlarm.push(item);
                cbItem();
            })
        }else{
            _updateAlarm.push(item);
            cbItem();
        }
    }, function () {
        //TODO: 更新通知信息
        dbAlarm.batch_set_notify_info(_updateAlarm, function (err) {
            if(err){
                logger.error({msg: 'set alarm notify info failed', err: err});
            }else{
                for(var i=0;i<_updateAlarm.length;i++){
                    var item = _updateAlarm[i];
                    var _notify = item.notify;
                    _notify[item.key] = 1;
                }
            }
        });
    });
}

function get_notify_item(alarm, config, time) {
    var interval = time - alarm.startTime;
    var _notify = alarm.notify || {};
    if(!_notify['l'] && interval > config.leader.timeout){
        return {alarm: alarm, key: 'l', user: config.leader.id};
    }
    if(!_notify['d'] && interval > config.director.timeout){
        return {alarm: alarm, key: 'd', user: config.director.id};
    }
    if(!_notify['i'] && interval > config.inspector.timeout){
        return {alarm: alarm, key: 'i', user: config.inspector.id};
    }

    return undefined;
}

//告警升级通知
// function check_notify() {
//     var notify_config = rdbCFG.get_system_config(sysConfigKey.alarm_notify_config);
//     var _dic = {};
//     for (var area in notify_config){
//         _dic[area] = {};
//         if (notify_config[area] && notify_config[area].length > 0){
//             for (var i = 0; i < notify_config[area].length; i++){
//                 var _item = notify_config[area][i];
//                 if (_item.alarmClassID){
//                     for (var j = 0; j < _item.alarmClassID.length; j++){
//                         var alarmClasssID = _item.alarmClassID[j];
//                         _dic[area][alarmClassID] = _item
//                     }
//                 }
//             }
//
//         }
//     }
//     var now = new Date();
//     var alarm_list = rdbAlarm.get_all_alarm();
//     var _list = [];
//     for(var i=0;i<alarm_list.length;i++){
//         var alarm = alarm_list[i];
//         if(!alarm.isHangup && !alarm.isConfirmed && !alarm.isForce && !alarm.isFiltered){//未处理
//             var _alarm_area = alarm.source.id;
//             var _config = _dic[alarm.source.id][alarm.classID];
//             if(_config){
//                 var _n = get_notify_item(alarm, _config, now);
//                 if(_n){
//                     _list.push(_n);
//                 }
//             }
//         }
//     }
//     if(_list.length > 0){
//         notify(_list, now);
//     }
// }
function check_notify() {
    var notify_config = rdbCFG.get_system_config(sysConfigKey.alarm_notify_config);
    if(notify_config && notify_config.length > 0){
        var _dic = {};
        for(var i=0;i<notify_config.length;i++){
            var _item = notify_config[i];
            if(_item.alarmClassID){
                for(var j=0;j<_item.alarmClassID.length;j++){
                    var alarmClassID = _item.alarmClassID[j];
                    _dic[alarmClassID] = _item;
                }
            }
        }

        var now = new Date();
        var alarm_list = rdbAlarm.get_all_alarm();
        var _list = [];
        for(var i=0;i<alarm_list.length;i++){
            var alarm = alarm_list[i];
            if(!alarm.isHangup && !alarm.isConfirmed && !alarm.isForce && !alarm.isFiltered){//未处理
                var _config = _dic[alarm.classID];
                if(_config){
                    var _n = get_notify_item(alarm, _config, now);
                    if(_n){
                        _list.push(_n);
                    }
                }
            }
        }
        if(_list.length > 0){
            notify(_list, now);
        }
    }
}

function get_notify_config(alarm, notify_config){
    let config = null;

    if(notify_config && notify_config.length > 0){
        var source = alarm.source;
        let community = undefined;//人员所属社区id

        var areaIdentity = rdbNOR.get_parent_identity(source.serverNO, source.classID, source.id, uiclassID.area);
        if(areaIdentity){
            community = areaIdentity.id;
        }
        for(let i=0;i<notify_config.length;i++){
            let item = notify_config[i];
            if(community != null && community == item.community){
                config = item;
                break;
            }else if(community == null && item.community == null){
                config = item;
                break;
            }
        }
    }

    return config;
}

//告警产生通知
function notify_alarm_gen(alarm){
    var notify_configs = rdbCFG.get_system_config(sysConfigKey.alarm_notify_rule_config);
    var notify_config = get_notify_config(alarm, notify_configs);
    if(notify_config){
        if(check_notify_rule(alarm, notify_config)){
            var title = '告警产生通知';
            var msg = get_notify_msg(alarm, notify_config, 0);
            send_alarm_notify(msg, title, notify_config);
        }
    }
}

//告警结束通知
function notify_alarm_end(alarm, end_data){
    var notify_configs = rdbCFG.get_system_config(sysConfigKey.alarm_notify_rule_config);
    var notify_config = get_notify_config(alarm, notify_configs);
    if(notify_config && notify_config.option && notify_config.option.endNotify){
        if(check_notify_rule(alarm, notify_config)){
            var title = '告警结束通知';
            var msg = get_notify_msg(alarm, notify_config, 1, end_data);
            send_alarm_notify(msg, title, notify_config);
        }   
    }
}

//获取通知内容
function get_notify_msg(alarm, notify_config, type, data){
    var source = alarm.source;
    var buildingName = '';//楼栋名称
    var areaName = '';//设备路径

    let time = new Date();//开始或结束时间
    let pointValue = 0;//点值
    let level = alarm.level;//等级

    var msg = {};

    var areaIdentity = rdbNOR.get_parent_identity(source.serverNO, source.classID, source.id, uiclassID.building);
    if(areaIdentity){
        var area = rdbNO.get_by_identity(areaIdentity);
        if(area){
            buildingName = util.format('[%s]', area.fullName);
        }
    }

    areaName = get_device_path(source);

    if(type == 0) { //开始
        time = alarm.startTime || new Date();
        if(alarm.start) {
            pointValue = alarm.start.pointValue;
        }
    }else if (type == 1) { //结束
        if(data) {
            time = data.time ? new Date(data.time) : new Date();
            if(data.option) {
                pointValue = data.option.pointValue;
            }
        }
    }

    //短信通知内容
    var desc = '';
    if(alarm.desc) {
        desc = alarm.desc.replace(new RegExp('[\\[\\]]','g'),'');
    }

    var msg1 = util.format('%s%s  %s', buildingName, time.format_minute_without_year(), desc);

    //其他方式通知内容

    let alarm_name = '';
    let device_name = ''
    let point_desc = '';
    let alarm_condition = '';
    let alarm_time = ''; 
    let title_desc = '';

    var alp = ramdb.alp.get_alarm_type(alarm.classID);
    if(alp) {
        alarm_name = alp.name;
        if(alp.condition) {
            if(type == 0) {
                let genValue = '';
                if(alp.condition.genValue != null){
                    genValue = alp.condition.genValue;
                }else{
                    genValue = alp.condition.value == null ? '' : alp.condition.value;
                }
                alarm_condition = util.format('点值%s %s 产生告警', Condition.getText(alp.condition.type), genValue);
            }else{
                let endValue = '';
                if(alp.condition.endValue != null){
                    endValue = alp.condition.endValue;
                }else{
                    if(alp.condition.value != null){
                        endValue = alp.condition.value;
                    }else{
                        endValue = alp.condition.genValue == null ? '' : alp.condition.genValue;
                    }
                }
                alarm_condition = util.format('点值%s %s 结束告警', Condition.getText(Condition.getContrary(alp.condition.type)), endValue);
            }
        }
    }
    var device = rdbNO.get_by_identity(alarm.source);
    if(device) {
        device_name = util.format('[%s]', device.fullName);
        if(device.description && device.description != ''){
            device_name = device_name + util.format('[%s]', device.description);
        }
    }

    point_desc = alarm.desc.replace(new RegExp('\\[.*?\\]'),'');
    
    if(type == 0) {
        alarm_time = '产生时间: ' + time.format_datetime();
        title_desc = util.format('[%s]%s产生[%s]', AlarmLevel.getText(level), areaName, alarm_name);
    }else{
        alarm_time = '结束时间: ' + time.format_datetime();
        title_desc = util.format('[%s]%s[%s]恢复', AlarmLevel.getText(level), areaName, alarm_name);
    }

    // var msg2 = util.format('%s' + '\n\n' + '告警设备: %s' + '\n\n' + '告警内容: %s' + '\n\n' + '%s' + '\n\n' + '告警值: %s' + '\n\n' + '告警条件: %s',
    // title_desc, device_name, point_desc, alarm_time, pointValue, alarm_condition);

    var msg2 = title_desc + '\n\n告警设备: ' + device_name + '\n\n告警内容: ' + point_desc + '\n\n' + alarm_time +
    '\n\n告警值: ' + pointValue + '\n\n告警条件: ' + alarm_condition;
                
    msg.msg1 = msg1;
    msg.msg2 = msg2;

    return msg;
}

//获取逻辑设备路径
function get_device_path(identity){
    let path = '';
    let path_list = [];

    var obj = rdbNO.get_by_identity(identity);
    while(obj){
        path_list.push(obj.fullName);

        //只到楼栋层
        if(obj.classID == uiclassID.building){
            break;
        }

        var _parent = rdbNOR.get_parent_identity(obj.serverNO, obj.classID, obj.id);
        if(_parent){
            obj = rdbNO.get_by_identity(_parent);
        }else{
            break;
        }
    }

    if(path_list.length > 0){
        path_list = path_list.reverse();
        path = '[' + path_list.join('-') + ']';
    }

    return path;
}


//根据配置过滤是否需要通知
function check_notify_rule(alarm, notify_config) {
    var result = true;

    var source = alarm.source;
    var deviceServerNO = source.serverNO;
    var deviceClassID = source.classID;
    var deviceID = source.id;
    var alarmClassID = alarm.classID;

    //告警类型过滤
    if (notify_config.alarmClassID != undefined && notify_config.alarmClassID.indexOf(alarmClassID) < 0) {
        result = false;
    }
    //设备类型过滤
    if (result && notify_config.deviceClassID != undefined && notify_config.deviceClassID.indexOf(deviceClassID) < 0) {
        result = false;
    }
    //区域过滤
    var _region = notify_config.region;
    if (result && _region != undefined) {
        if (deviceClassID >= uiclassID.device && deviceClassID <= uiclassID.lastDevice) {
            var parent = rdbNOR.get_parent_identity(deviceServerNO, deviceClassID, deviceID, _region.classID);
            if (!parent || parent.id != _region.id) {
                result = false;
            }
        } else {//故障告警
            if (_region.classID == deviceClassID) {
                if (!_region.id == deviceID) {
                    result = false;
                }
            } else {
                var parent = rdbNOR.get_parent_identity(deviceServerNO, deviceClassID, deviceID, _region.classID);
                if (!parent || parent.id != _region.id) {
                    result = false;
                }
            }
        }
    }

    return result;
}


//发送通知
function send_alarm_notify(msg, title, notify_config){
    if(notify_config.modelist && notify_config.modelist.length > 0){
        ah.each_series(notify_config.modelist, function (item, cbItem) {
            _send_alarm_notify(msg, title, item, notify_config.option);
            process.nextTick(function () {
                cbItem();
            })
        }, function () {
            
        })
    }
}

function _send_alarm_notify(msg, title, modeItem, option) {
    if(!option || !modeItem){
        return;
    }
    if(!modeItem.enable){//不启用该通知方式
        return;
    }
    if(!modeItem.list || modeItem.list.length == 0){
        return;
    }

    ah.each_series(modeItem.list, function (item, cbItem) {
        var opt = {times: option.retry, interval: option.retryInterval};
        if(!option.retry){
            opt.times = 1;//默认发送一次
        }
        var recipient = item;
        let mode = modeItem.mode;
        let sendMsg = msg.msg2;

        if(mode == NoticeType.message) {
            sendMsg = msg.msg1;
        }

        ah.retry(opt, function (cb) {
            msgHelper.send_message(mode, recipient, title, sendMsg, function (err) {
                if(err){
                    logger.error({msg: 'send message failed', err: err, mode: mode});
                }
                cb(err);
            });
        }, function (err) {
            if(err){
                logger.error({msg: 'send message finally failed', data: sendMsg, err: err})
            }
        });

        cbItem();
    });
}

function start_process() {
    Notification.on(Emitter.alarm, 'start', function (alarm) {
        notify_alarm_gen(alarm);
    });
    Notification.on(Emitter.alarm, 'end', function (alarm, end_data) {
        notify_alarm_end(alarm, end_data);
    });

    setInterval(function () {
        check_notify();
    }, check_interval);
}

module.exports.start_process = start_process;
module.exports.notify_alarm_gen = notify_alarm_gen;
module.exports.notify_alarm_end = notify_alarm_end;