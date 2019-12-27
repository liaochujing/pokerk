/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbDEP = db.dep;

    //删除空配置数据
    for(var i=0;i<body.pointList.length;i++){
        var _point = body.pointList[i];
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

    body.time = new Date();
    dbDEP.insert_device_type(body.system, body.systemName, body.group, body.groupName, body.id, body.name, body.desc, body.pointList, body.config, body.time, function (err) {
        if(err) return callback(err);

        var _type = {
            system: body.system,
            systemName: body.systemName,
            group: body.group,
            groupName: body.groupName,
            id: body.id,
            name: body.name,
            desc: body.desc,
            pointList: body.pointList,
            config: body.config,
            time: body.time
        };
        db.ramdb.dep.set_type(_type);

        notifyHelper.send_notify(new NotifyMsg(NotifyType.device_type_changed, _type));
        dbOPL.insert_user_log(ManagerAction.add_device_type, req.user, '创建设备类型:' + _type.name, _type, new Date());

        callback();
    });
}

module.exports.privilege = privilegePoint.addDeviceType;
module.exports.cmd = cmd.mgr_0x00010005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
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
    }
};