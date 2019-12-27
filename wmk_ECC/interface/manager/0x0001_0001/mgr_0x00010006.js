/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var privilegePoint = require('../../../definition/privilege_point');
var uiclassID  = require('../../../definition/uiClassID');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var template = body.template;
    var option = body.option;
    
    var dbNO = db.no;
    var dbDP = db.dp;
    var dbDEP = db.dep;

    var preType = db.ramdb.dep.get_device_type(template);
    if(!preType){
        callback({status: code.not_found, msg: 'device type not found'});
        return;
    }
    if(template.config && preType.config && template.config.classID != preType.config.classID){
        callback({status: code.not_found, msg: 'device type binding class id changed'});
        return;
    }

    //删除空配置数据
    for(var i=0;i<template.pointList.length;i++){
        var _point = template.pointList[i];
        if(_point.binding && _point.binding.pointIndex == 0){
            delete _point.binding;
        }
        var _option = _point.option;
        if(_option){
            var _his = _option.his;
            if(_his){
                if(_his.threshold){
                    if(!_his.threshold.absolute && !_his.threshold.percentage){
                        delete _his.threshold;
                    }
                }
            }
        }
        var _config = _point.config;
        if(_config){
            var _value = _config.value;
            if(_value){
                if(_value.expression){
                    if(!_value.expression.formula && !_value.expression.source){
                        delete _value.expression;
                    }
                }
                if(!_value.expression){
                    delete _config.value;
                }
            }else{
                delete _config.value;
            }
            var _alarm = _config.alarm;
            if(_alarm){
                if(Array.isArray(_alarm)){
                    let _temp = [];
                    for(let i=0;i<_alarm.length;i++){
                        let _items = _alarm[i];
                        if(_items.id){
                            _temp.push(_items);
                        }
                    }

                    if(_temp.length > 0){
                        _config.alarm = _temp;
                    }else{
                        delete _config.alarm;
                    }
                }else{
                    delete _config.alarm;
                }
            }else{
                delete _config.alarm;
            }
        }else{
            _point.config = {};
        }
        var _binding = _point.binding;
        if(_binding){
            if(!_binding.pointIndex){
                delete _point.binding;
            }
        }
    }

    var now = new Date();
    template.time = now;
    dbDEP.upsert_device_type(template.system, template.systemName, template.group, template.groupName, template.id, template.name, template.desc, template.pointList, template.config, template.time, function (err) {
        if(err) return callback(err);

        var _type = {
            system: template.system,
            systemName: template.systemName,
            group: template.group,
            groupName: template.groupName,
            id: template.id,
            name: template.name,
            desc: template.desc,
            pointList: template.pointList,
            config: template.config,
            time: template.time
        };
        db.ramdb.dep.set_type(_type);

        notifyHelper.send_notify(new NotifyMsg(NotifyType.device_type_changed, _type));
        dbOPL.insert_user_log(ManagerAction.modify_device_type, req.user, '修改设备类型:' + _type.name, _type, new Date());

        var _dicPointIndex = {};
        var shouldUpdate = JSON.stringify(template.pointList) != JSON.stringify(preType.pointList);
        if(option.binding || option.alarm || option.other || option.value.apply){
            shouldUpdate = true;
        }
        if(option.value && option.value.apply){
            for(var i=0;i<option.value.pointIndexList.length;i++){
                var pointIndex = option.value.pointIndexList[i];
                _dicPointIndex[pointIndex] = 1;
            }
        }
        if(shouldUpdate){
            logger.warn({msg: 'device type changed, try regen device point', type: {system: template.system, group: template.group, id: template.id}});

            var tempList = [];

            var deviceList = undefined;
            var _areas = option.areas;
            if(_areas && _areas.length > 0){
                var _idDic = {};
                for(var k=0;k<_areas.length;k++){
                    var _area = _areas[k];
                    var identitys = db.ramdb.nor.get_child_identity_range(_area.serverNO, _area.classID, _area.id, uiclassID.device, uiclassID.lastDevice);
                    for(var i=0;i<identitys.length;i++){
                        var device = db.ramdb.no.get_by_identity(identitys[i]);
                        if(device && device.type && !_idDic[device.id]){
                            if (device.type.system == template.system && device.type.group == template.group && device.type.id == template.id) {
                                _idDic[device.id] = 1;//防止重复
                                tempList.push(device);
                            }
                        }
                    }
                }
            }else{
                var deviceList = db.ramdb.no.get_by_class_rang(uiclassID.device, uiclassID.lastDevice);
                for(var i=0;i<deviceList.length;i++) {
                    var device = deviceList[i];
                    if (device.type) {
                        if (device.type.system == template.system && device.type.group == template.group && device.type.id == template.id) {
                            tempList.push(device);
                        }
                    }
                }
            }

            var pointTypeDic = {};
            for(var i=0;i<template.pointList.length;i++){
                var _p = template.pointList[i];
                pointTypeDic[_p.pointIndex] = _p;
            }

            ah.each_series(tempList, function (device, cbItem) {
                dbNO.update_nameobject_time(device.serverNO, device.classID, device.id, now, function (err) {
                    if(err){
                        logger.error({msg: 'device regen point, update config time failed', device: device});
                        cbItem();
                        return;
                    }

                    dbDP.find_device_point({deviceServerNO: device.serverNO, deviceClassID: device.classID, deviceID: device.id}, {_id: 0, pointIndex: 1, pointType: 1, config: 1, option: 1, binding: 1}, function (err, points) {
                        if(err){
                            logger.error({msg: 'device regen device get point failed', device: device});
                        }

                        var _points = [];
                        if(points){
                            for(var i=0;i<points.length;i++){
                                var _p = points[i];
                                var _tp = pointTypeDic[_p.pointIndex];

                                if(_tp){
                                    var _binding = _p.binding;
                                    if(option.binding){
                                        if(!_binding){
                                            _binding = _tp.binding;
                                        }else{
                                            if(_tp.binding){
                                                _binding.pointIndex = _tp.binding.pointIndex;
                                            }else{
                                                delete _binding.pointIndex;
                                            }
                                        }
                                    }
                                    var _config = _p.config;
                                    if(option.alarm && _tp.config){
                                        _config.alarm = _tp.config.alarm;
                                    }
                                    if(option.value && option.value.apply && _dicPointIndex[_tp.pointIndex] &&  _tp.config){
                                        // if(_tp.config.value && _tp.config.value.expression && _tp.config.value.expression.source){
                                        _config.value = _tp.config.value;
                                        // }
                                    }
                                    var _option = _p.option;
                                    if(option.other && _tp.option){
                                        if(_tp.option.transform){
                                            _option.transform = _tp.option.transform;
                                        }
                                        if(_tp.option.his){
                                            _option.his = _tp.option.his;
                                        }
                                        if(_tp.option.condition){
                                            _option.condition = _tp.option.condition;
                                        }
                                    }

                                    _points.push({pointIndex: _tp.pointIndex, config: _config, binding: _binding, option: _option});
                                }
                            }
                        }

                        device.regen_point_list(_points, function (err) {
                            if(err){
                                logger.error({msg: 'device regen device point failed', device: device});
                                cbItem();
                                return;
                            }
                            notifyHelper.send_notify(new NotifyMsg(NotifyType.device_point_modified, {serverNO: device.serverNO, classID: device.classID, id: device.id, reload: 1, type: device.type, points: _points, time: now}));
                            cbItem();
                        })
                    });
                })
            }, function () {
                logger.info({msg: 'device type changed, regen device point finished', type: {system: template.system, group: template.group, id: template.id}});
            })
        }

        callback();
    });
}

module.exports.privilege = privilegePoint.modifyDeviceType;
module.exports.cmd = cmd.mgr_0x00010006;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        template: {type: 'object', properties: {
            system: {type: 'number', required: true},
            systemName: {type: 'string', required: true},
            group: {type: 'number', required: true},
            groupName: {type: 'string', required: true},
            id: {type: 'number', required: true},
            name: {type: 'string', required: true},
            desc: {type: 'string', required: true},
            pointList: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        pointType: {type: 'number', required: true},
                        pointIndex: {type: 'number', required: true},
                        name: {type: 'string', required: true},
                        unit: {type: 'string'},
                        busType: {type: 'number'},

                        config: {type: 'object'},
                        option: {type: 'object'},
                        binding: {type: 'object'}
                    }
                },
                required: true
            },
            config: {type: 'object'}
        }, required: true},
        option: {
            type: 'object',
            properties: {
                areas: {//引用范围
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            properties: {
                                serverNO: {type: 'number', required: true},
                                classID: {type: 'number', required: true},
                                id: {type: 'number', required: true}
                            }
                        }
                    }
                },
                binding: {type: "number", enum: [0, 1], required: true},//应用绑定配置
                value: {//应用表达式配置
                    type: "object",
                    properties: {
                        apply: {type: 'number', enum: [0, 1], required: true},
                        pointIndexList: {type: 'array', items: {type: 'number'}, required: true}
                    },
                    required: true},
                alarm: {type: 'number', enum: [0, 1], required: true},//应用告警告警配置
                other: {type: 'number', enum: [0, 1], required: true}//应用其他参数(精度、历史保存条件等)
            },
            required: true
        }
    }
};