/**
 * Created by wangxh on 2019/3/19.
 */

'use strict';

var logger = require('../../../util/log_manager').logger;
var Notification = require('../../../helpers/notification_helper');
var Emitter = Notification.Emitter;

var util = require('util');
var device_helper = require('../../../helpers/device_helper');
var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var alarmLevel = require('../../../definition/alarm_level');
var alarm_type = require('../../../definition/alarm_type');
var alarm_mold = require('../../../definition/alarm_mold');
var request = require('request');
var uiclassID = require('../../../definition/uiClassID');
var Condition = require('../../../definition/condition');
var point_type = require('../../../definition/point_type');

var db = require('../../../db');
var rdbALP = db.ramdb.alp;
var rdbNO = db.ramdb.no;
var rdbNOR = db.ramdb.nor;

var _configMap = {};
var _postUrl = undefined;

function run() {
    var config = db.ramdb.cfg.get_system_config(sysConfigKey.alarm_notify_rule_config);
    if(config){
        if(Array.isArray(config)){
            for(let i=0;i<config.length;i++){
                let item = config[i];
                load_message_config(item);
            }
        }else{
            load_message_config(config);
        }
    }
    var config = db.ramdb.cfg.get_system_config(sysConfigKey.xh_alarm_notify_plug_in);
    if(config){
        _postUrl = config.url;
    }

    function load_message_config(item) {
        if(item.third_party){
            let community = item.community;
            let end_notify = item.option.endNotify;

            let url = item.third_party.url;
            let target_phone = item.third_party.target_phone;

            _configMap[community] = {
                community: community,
                end_notify: end_notify,
                url: url,
                target_phone: target_phone
            }
        }
    }

    Notification.on(Emitter.config, 'xh_alarm_message_notify_plug_in', function (config) {
        load_message_config(config)
    });

    Notification.on(Emitter.config, 'xh_alarm_notify_plug_in', function (config) {
        _postUrl = config.url;
    });

    Notification.on(Emitter.alarm, 'start', function (alarm) {
        //平台推送
        {
            if(_postUrl != undefined){
                let send_data = {
                    Summary: '',//标题
                    Alarm_sys: '',//系统
                    Alarm_des: '',//描述
                    Alarm_id: alarm.serverNO + '_' + alarm.classID + '_' + alarm.id,//id
                    Alarm_level: '',//等级
                    Alarm_begin: (alarm.startTime || new Date()).format_datetime(),//开始时间
                    Alarm_end: '',//结束时间
                    Alarm_source: '',//位置
                    Alarm_projectCode: '', //社区代码，例：09900，按兴海要求的标准
                    Alarm_projectName: '', //社区名称，例：中海华庭
                    Alarm_areaName: '', //告警机房名，例：1变压器室
                    Alarm_deviceName: '', //告警设备名，例：温湿度传感器
                    Alarm_pointName: '', //告警设备点名，例：温度、湿度、A相电压
                    Alarm_deviceID: '', //告警设备ID
                    Alarm_pointID: 0, //告警点ID
                    Alarm_pointValue: 0, //告警值（产生或结束时的值），例：1，0，45.1
                    Alarm_condition: '', //告警条件（产生和结束条件）例：>30，持续30秒；
                };

                if(alarm.start) {
                    send_data.Alarm_pointValue = alarm.start.pointValue;
                }
                let _type = rdbALP.get_alarm_type(alarm.classID);
                if(_type != undefined && _type.option){
                    send_data.Summary = alarm_mold.getText(_type.option.mold);
                    // send_data.Alarm_sys = alarm_type.getText(_type.option.type);
                    send_data.Alarm_level = alarmLevel.getText(_type.option.level);
                    send_data.Alarm_des = _type.option.meaning;
                    if(_type.condition) {
                        send_data.Alarm_condition = util.format('点值%s %s 产生告警, %s %s 结束告警, 告警开始延时: %s ms, 告警结束延时: %s ms',
                            Condition.getText(_type.condition.type), _type.condition.genValue, Condition.getText(Condition.getContrary(_type.condition.type)), (_type.condition.endValue == undefined ? _type.condition.value : _type.condition.endValue), _type.option.startDelay, _type.option.endDelay);
                    }
                }
                var device = rdbNO.get_by_identity(alarm.source);
                if(device) {
                    send_data.Alarm_sys = device.system || '';
                    send_data.Alarm_deviceName = device.fullName;
                    send_data.Alarm_source = get_device_path(device);
                    send_data.Alarm_deviceID = device.serverNO + '_' + device.classID + '_' + device.id;
                    send_data.Alarm_pointID = alarm.source.pointIndex;

                    var device_type = db.ramdb.dep.get_device_type(device.type);
                    if(device_type && device_type.pointList){
                        for(let i=0;i<device_type.pointList.length;i++){
                            let _p = device_type.pointList[i];
                            if(_p.pointIndex == alarm.source.pointIndex){
                                send_data.Alarm_pointName = _p.name;
                                if(_p.pointType == point_type.DI){
                                    //点值取点描述
                                    send_data.Alarm_pointValue = get_point_desc(_p.desc, send_data.Alarm_pointValue);
                                }else{
                                    send_data.Alarm_pointValue = send_data.Alarm_pointValue + (_p.unit || '')
                                }
                                break;
                            }
                        }
                    }
                }
                let obj = alarm.source;
                var areas = rdbNOR.get_parent_identity(obj.serverNO, obj.classID, obj.id, uiclassID.area);
                if(areas){
                    var _areas = rdbNO.get_by_identity(areas);
                    if(_areas){
                        //社区
                        send_data.Alarm_projectName = _areas.fullName;
                        send_data.Alarm_projectCode = _areas.projectID || '';
                    }
                }
                var rooms = rdbNOR.get_parent_identity(obj.serverNO, obj.classID, obj.id);
                if(rooms){
                    var _rooms = rdbNO.get_by_identity(rooms);
                    if(_rooms){
                        //机房
                        send_data.Alarm_areaName = _rooms.fullName;
                    }
                }

                request.post(_postUrl, {
                    body: send_data,
                    json: true
                }, function (err, res, body) {
                    if(err) {
                        logger.error({msg: 'xh alarm start notify failed', err: err});
                    }else{
                        logger.info(body);
                    }
                });
            }
        }
        //短信推送
        {
            let _source = alarm.source;
            if(_source){
                let community = undefined;//人员所属社区id
                var areaIdentity = rdbNOR.get_parent_identity(_source.serverNO, _source.classID, _source.id, uiclassID.area);
                if(areaIdentity){
                    community = areaIdentity.id;
                }
                let _config = _configMap[community];
                if(!_config){
                    return;
                }

                let send_data = {
                    Alarm_projectName: '', //社区名称，例：中海华庭
                    Alarm_sys: '',//系统
                    Alarm_des: '',//描述
                    Alarm_areaName: '', //告警机房名，例：1变压器室
                    Alarm_deviceName: '', //告警设备名，例：温湿度传感器
                    Alarm_pointName: '', //告警设备点名，例：温度、湿度、A相电压
                    Alarm_begin: (alarm.startTime || new Date()).format_datetime(),//开始时间
                    // Alarm_end: '',//结束时间
                    Alarm_condition: '', //告警条件（产生和结束条件）例：>30，持续30秒；
                    target_phone: _config.target_phone,
                    Alarm_pointValue: '', //告警值（产生或结束时的值），例：1，0，45.1
                };

                if(alarm.start) {
                    send_data.Alarm_pointValue = '' + alarm.start.pointValue;
                }
                let _unit = '';

                var device = rdbNO.get_by_identity(_source);
                if(device) {
                    send_data.Alarm_sys = device.system || '';
                    send_data.Alarm_deviceName = device.fullName;
                    var _p = db.ramdb.dep.get_device_type_point(device.type, _source.pointIndex);
                    if(_p){
                        _unit = _p.unit || '';
                        send_data.Alarm_pointName = _p.name;
                        if(_p.pointType === point_type.DI){
                            //点值取点描述
                            let _desc = get_point_desc(_p.desc, send_data.Alarm_pointValue);
                            if(_desc != undefined){
                                send_data.Alarm_pointValue = _desc;
                            }else{
                                send_data.Alarm_pointValue = send_data.Alarm_pointValue + _unit;
                            }
                        }else{
                            send_data.Alarm_pointValue = send_data.Alarm_pointValue + _unit;
                        }
                    }
                }
                var areas = rdbNOR.get_parent_identity(_source.serverNO, _source.classID, _source.id, uiclassID.area);
                if(areas){
                    var _areas = rdbNO.get_by_identity(areas);
                    if(_areas){
                        //社区
                        send_data.Alarm_projectName = _areas.fullName;
                    }
                }
                var rooms = rdbNOR.get_parent_identity(_source.serverNO, _source.classID, _source.id);
                if(rooms){
                    var _rooms = rdbNO.get_by_identity(rooms);
                    if(_rooms){
                        //机房
                        send_data.Alarm_areaName = _rooms.fullName;
                        // send_data.Alarm_sys = _rooms.system || '';
                    }
                }
                let _type = rdbALP.get_alarm_type(alarm.classID);
                if(_type !== undefined && _type.option){
                    // send_data.Alarm_sys = alarm_type.getText(_type.option.type);
                    send_data.Alarm_des = _type.option.meaning;
                    if(_type.condition) {
                        send_data.Alarm_condition = util.format('%s%s%s', send_data.Alarm_pointName, Condition.getText(_type.condition.type), '' + (_type.condition.genValue == undefined ? _type.condition.value : _type.condition.genValue) + _unit);
                        // send_data.Alarm_condition = util.format('点值%s %s 产生告警, %s %s 结束告警, 告警开始延时: %s ms, 告警结束延时: %s ms',
                        //     Condition.getText(_type.condition.type), _type.condition.genValue, Condition.getText(Condition.getContrary(_type.condition.type)), _type.condition.genValue,
                        //     _type.option.startDelay, _type.option.endDelay);
                    }
                }

                request.post(_config.url, {
                    body: send_data,
                    json: true
                }, function (err, res, body) {
                    if(err) {
                        logger.error({msg: 'xh alarm start notify failed', err: err});
                    }else{
                        logger.info('xh notify alarm start: %j, result: %j', send_data, body);
                    }
                });
            }
        }
    });
    Notification.on(Emitter.alarm, 'end', function (alarm, end_data) {
        //平台推送
        {
            if(_postUrl != undefined){
                let send_data = {
                    Summary: '',//标题
                    Alarm_sys: '',//系统
                    Alarm_des: '',//描述
                    Alarm_id: alarm.serverNO + '_' + alarm.classID + '_' + alarm.id,//id
                    Alarm_level: '',//等级
                    Alarm_begin: (alarm.startTime || new Date()).format_datetime(),//开始时间
                    Alarm_end: '',//结束时间
                    Alarm_source: '',//位置
                    Alarm_projectCode: '', //社区代码，例：09900，按兴海要求的标准
                    Alarm_projectName: '', //社区名称，例：中海华庭
                    Alarm_areaName: '', //告警机房名，例：1变压器室
                    Alarm_deviceName: '', //告警设备名，例：温湿度传感器
                    Alarm_pointName: '', //告警设备点名，例：温度、湿度、A相电压
                    Alarm_deviceID: '', //告警设备ID
                    Alarm_pointID: 0, //告警点ID
                    Alarm_pointValue: 0, //告警值（产生或结束时的值），例：1，0，45.1
                    Alarm_condition: '', //告警条件（产生和结束条件）例：>30，持续30秒；
                }

                if(end_data) {
                    if(end_data.option){
                        send_data.Alarm_pointValue = end_data.option.pointValue;
                    }
                    send_data.Alarm_end = (end_data.time ? new Date(end_data.time) : new Date()).format_datetime()
                }
                let _type = rdbALP.get_alarm_type(alarm.classID);
                if(_type != undefined && _type.option){
                    send_data.Summary = alarm_mold.getText(_type.option.mold);
                    // send_data.Alarm_sys = alarm_type.getText(_type.option.type);
                    send_data.Alarm_level = alarmLevel.getText(_type.option.level);
                    send_data.Alarm_des = _type.option.meaning;
                    if(_type.condition) {
                        send_data.Alarm_condition = util.format('点值%s %s 产生告警, %s %s 结束告警, 告警开始延时: %s ms, 告警结束延时: %s ms',
                            Condition.getText(_type.condition.type), _type.condition.genValue, Condition.getText(Condition.getContrary(_type.condition.type)), _type.condition.endValue,
                            _type.option.startDelay, _type.option.endDelay);
                    }
                }
                var device = rdbNO.get_by_identity(alarm.source);
                if(device) {
                    send_data.Alarm_sys = device.system || '';
                    send_data.Alarm_deviceName = device.fullName;
                    send_data.Alarm_source = get_device_path(device);
                    send_data.Alarm_deviceID = device.serverNO + '_' + device.classID + '_' + device.id;
                    send_data.Alarm_pointID = alarm.source.pointIndex;

                    var device_type = db.ramdb.dep.get_device_type(device.type);
                    if(device_type && device_type.pointList){
                        for(let i=0;i<device_type.pointList.length;i++){
                            let _p = device_type.pointList[i];
                            if(_p.pointIndex == alarm.source.pointIndex){
                                send_data.Alarm_pointName = _p.name;
                                if(_p.pointType == point_type.DI){
                                    //点值取点描述
                                    send_data.Alarm_pointValue = get_point_desc(_p.desc, send_data.Alarm_pointValue);
                                }else{
                                    send_data.Alarm_pointValue = send_data.Alarm_pointValue + (_p.unit || '')
                                }
                                break;
                            }
                        }
                    }
                }
                let obj = alarm.source;
                var areas = rdbNOR.get_parent_identity(obj.serverNO, obj.classID, obj.id, uiclassID.area);
                if(areas){
                    var _areas = rdbNO.get_by_identity(areas);
                    if(_areas){
                        //社区
                        send_data.Alarm_projectName = _areas.fullName;
                        send_data.Alarm_projectCode = _areas.projectID || '';
                    }
                }
                var rooms = rdbNOR.get_parent_identity(obj.serverNO, obj.classID, obj.id);
                if(rooms){
                    var _rooms = rdbNO.get_by_identity(rooms);
                    if(_rooms){
                        //机房
                        send_data.Alarm_areaName = _rooms.fullName;
                    }
                }

                request.post(_postUrl, {
                    body: send_data,
                    json: true
                }, function (err, res, body) {
                    if(err) {
                        logger.error({msg: 'xh alarm start notify failed', err: err});
                    }else{
                        logger.info(body);
                    }
                });
            }
        }
        //短信推送
        {
            let _source = alarm.source;
            if(_source){
                let community = undefined;//人员所属社区id
                var areaIdentity = rdbNOR.get_parent_identity(_source.serverNO, _source.classID, _source.id, uiclassID.area);
                if(areaIdentity){
                    community = areaIdentity.id;
                }
                let _config = _configMap[community];
                if(!_config || !_config.end_notify){
                    return;
                }

                let send_data = {
                    Alarm_projectName: '', //社区名称，例：中海华庭
                    Alarm_sys: '',//系统
                    Alarm_des: '',//描述
                    Alarm_areaName: '', //告警机房名，例：1变压器室
                    Alarm_deviceName: '', //告警设备名，例：温湿度传感器
                    Alarm_pointName: '', //告警设备点名，例：温度、湿度、A相电压
                    Alarm_begin: (alarm.startTime || new Date()).format_datetime(),//开始时间
                    Alarm_end: '',//结束时间
                    Alarm_condition: '', //告警条件（产生和结束条件）例：>30，持续30秒；
                    target_phone: _config.target_phone,
                    Alarm_pointValue: '', //告警值（产生或结束时的值），例：1，0，45.1
                };

                if(end_data) {
                    if(end_data.option){
                        send_data.Alarm_pointValue = end_data.option.pointValue;
                    }
                    send_data.Alarm_end = (end_data.time ? new Date(end_data.time) : new Date()).format_datetime()
                }

                let _unit = '';

                var device = rdbNO.get_by_identity(_source);
                if(device) {
                    send_data.Alarm_sys = device.system || '';
                    send_data.Alarm_deviceName = device.fullName;
                    var _p = db.ramdb.dep.get_device_type_point(device.type, _source.pointIndex);
                    if(_p){
                        _unit = _p.unit || '';
                        send_data.Alarm_pointName = _p.name;
                        if(_p.pointType === point_type.DI){
                            //点值取点描述
                            let _desc = get_point_desc(_p.desc, send_data.Alarm_pointValue);
                            if(_desc != undefined){
                                send_data.Alarm_pointValue = _desc;
                            }else{
                                send_data.Alarm_pointValue = send_data.Alarm_pointValue + _unit;
                            }
                        }else{
                            send_data.Alarm_pointValue = send_data.Alarm_pointValue + _unit;
                        }
                    }
                }
                var areas = rdbNOR.get_parent_identity(_source.serverNO, _source.classID, _source.id, uiclassID.area);
                if(areas){
                    var _areas = rdbNO.get_by_identity(areas);
                    if(_areas){
                        //社区
                        send_data.Alarm_projectName = _areas.fullName;
                    }
                }
                var rooms = rdbNOR.get_parent_identity(_source.serverNO, _source.classID, _source.id);
                if(rooms){
                    var _rooms = rdbNO.get_by_identity(rooms);
                    if(_rooms){
                        //机房
                        send_data.Alarm_areaName = _rooms.fullName;
                        // send_data.Alarm_sys = _rooms.system;
                    }
                }
                let _type = rdbALP.get_alarm_type(alarm.classID);
                if(_type !== undefined && _type.option){
                    // send_data.Alarm_sys = alarm_type.getText(_type.option.type);
                    send_data.Alarm_des = _type.option.meaning;
                    if(_type.condition) {
                        send_data.Alarm_condition = util.format('%s%s%s', send_data.Alarm_pointName, Condition.getText(_type.condition.type), '' + (_type.condition.genValue == undefined ? _type.condition.value : _type.condition.genValue) + _unit);
                        // send_data.Alarm_condition = util.format('点值%s %s 产生告警, %s %s 结束告警, 告警开始延时: %s ms, 告警结束延时: %s ms',
                        //     Condition.getText(_type.condition.type), _type.condition.genValue, Condition.getText(Condition.getContrary(_type.condition.type)), _type.condition.endValue,
                        //     _type.option.startDelay, _type.option.endDelay);
                    }
                }

                request.post(_config.url, {
                    body: send_data,
                    json: true
                }, function (err, res, body) {
                    if(err) {
                        logger.error({msg: 'xh alarm start notify failed', err: err});
                    }else{
                        logger.info('xh notify alarm end: %j, result: %j', send_data, body);
                    }
                });
            }
        }
    });
}

//获取逻辑设备路径
function get_device_path(identity){
    let path = '';
    let path_list = [];

    var obj = rdbNO.get_by_identity(identity);
    while(obj){
        path_list.push(obj.fullName);

        //只到区域(社区)
        if(obj.classID === uiclassID.area){
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

//获取di点描述
function get_point_desc(desc, value){
    let result = null;
    if (desc) {
        var dic = {};
        var array = desc.split(';');
        for (var i = 0; i < array.length; i++) {
            var item = array[i];
            var array2 = item.split(',');
            if (array2.length > 1) {
                dic[array2[0]] = array2[1];
            }
        }

        result = dic[value];
    }
    return result;
}

module.exports.run = run;