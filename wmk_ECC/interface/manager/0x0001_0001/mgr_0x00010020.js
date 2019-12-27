/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbDP = db.dp;
    var dbNO = db.no;

    var time = new Date();
    dbNO.update_nameobject_time(body.serverNO, body.classID, body.id, time, function (err) {
        if(err) {
            logger.error({msg: 'device point config update modify device modify time failed', data: body});
            callback(err);
            return;
        }

        for(var i=0;i<body.points.length;i++){
            var _item = body.points[i];
            if(_item.config == null){
                _item.config = {}
            }
            if(_item.config.value && _item.config.value.expression){
                if(!_item.config.value.expression.formula){
                    delete _item.config.value.expression;
                }else{
                    var formula = _item.config.value.expression.formula;

                    formula = formula.replace(/serverNO/g, '' + body.serverNO);
                    formula = formula.replace(/id/g, '' + body.id);
                    _item.config.value.expression.formula = formula;
                }
            }
            if(_item.config.alarm && _item.config.alarm.length > 0){
                for(let j=0;j<_item.config.alarm.length;j++){
                    let alarm_item = _item.config.alarm[j];
                    if(alarm_item.hangup){
                        if(alarm_item.hangup.start){
                            alarm_item.hangup.start = new Date(alarm_item.hangup.start);
                        }
                        if(alarm_item.hangup.end){
                            alarm_item.hangup.end = new Date(alarm_item.hangup.end);
                        }
                    }
                    if(alarm_item.shield){
                        if(alarm_item.shield.start){
                            alarm_item.shield.start = new Date(alarm_item.shield.start);
                        }
                        if(alarm_item.shield.end){
                            alarm_item.shield.end = new Date(alarm_item.shield.end);
                        }
                    }
                }
            }
            _item.time = time;
        }

        dbDP.update_devicepoint_data_list(body.serverNO, body.classID, body.id, body.points, function (err) {
            if(err){
                logger.error({msg: 'sync update point hangup failed', data: body});
                callback(err);
                return;
            }

            var rdbDP = db.ramdb.dp;
            if(rdbDP){
                for(var i=0;i<body.points.length;i++){
                    var _item = body.points[i];
                    var point = rdbDP.get_point_sync(body.serverNO, body.classID, body.id, _item.pointIndex);
                    if(point){
                        point.option = _item.option;
                        point.config = _item.config;
                        point.binding = _item.binding;
                    }
                }
            }

            notifyHelper.send_notify(new NotifyMsg(NotifyType.device_point_modified, {serverNO: body.serverNO, classID: body.classID, id: body.id, points: body.points, time: time}));

            var device = db.ramdb.no.get_no_sync(body.serverNO, body.classID, body.id);
            if(device){
                dbOPL.insert_user_log(ManagerAction.set_device_point, req.user, '修改设备:' + device.fullName + ' 设备点配置', req.body, new Date());
            }

            callback();
        });
    });
}

module.exports.cmd = cmd.mgr_0x00010020;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        points: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    pointIndex: {type: 'number', required: true},
                    config: {
                        value: {
                            type: 'object',
                            properties: {
                                from: {
                                    type: 'object',
                                    properties: {
                                        serverNO: {type: 'number'},
                                        classID: {type: 'number'},
                                        id: {type: 'number'},
                                        pointIndex: {type: 'number', required: true}
                                    }
                                },
                                expression: {
                                    type: 'object',
                                    properties: {
                                        source: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    serverNO: {type: 'number'},
                                                    classID: {type: 'number'},
                                                    id: {type: 'number'},
                                                    pointIndex: {type: 'number', required: true}
                                                }
                                            },
                                            required: true
                                        },
                                        formula: {type: 'string', required: true}
                                    }
                                }
                            }
                        },
                        alarm: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: {type: 'number', required: true},
                                    shield: {
                                        type: 'object',
                                        properties: {
                                            enabled: {type: 'number', enum: [0, 1], required: true},
                                            start: {type: 'string'},
                                            end: {type: 'string'}
                                        }
                                    },
                                    // convergence: {
                                    //     type: 'object',
                                    //     properties: {
                                    //         enabled: {type: 'number', enum: [0, 1], required: true},
                                    //         start: {type: 'string'},
                                    //         end: {type: 'string'}
                                    //     }
                                    // },
                                    hangup: {
                                        type: 'object',
                                        properties: {
                                            enabled: {type: 'number', enum: [0, 1], required: true},
                                            start: {type: 'string'},
                                            end: {type: 'string'}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    option: {
                        type: 'object',
                        properties: {
                            transform: {
                                type: 'object',
                                properties: {
                                    scaling: {type: 'number'},
                                    offset:{type: 'number'},
                                    reversal: {type: 'number', enum: [0, 1]},
                                    precision: {type: 'number'}
                                }
                            },
                            his: {
                                type: 'object',
                                properties: {
                                    interval: {type: 'number', required: true},//保存间隔(默认)
                                    threshold: {
                                        type: 'object',
                                        properties: {
                                            percentage: {type: 'number'},//百分比
                                            absolute: {type: 'number'}//阈值
                                        }
                                    },
                                    others: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                serverNO: {type: 'number'},
                                                classID: {type: 'number'},
                                                id: {type: 'number'},
                                                pointIndex: {type: 'number'},//设备点
                                                type: {type: 'number'},//判断条件
                                                value: {type: 'number'},//判断值
                                                interval: {type: 'number'},//符合条件时保存的间隔
                                            }
                                        }
                                    },
                                    keep_value: {type: 'integer', enum: [0, 1]}//是否保留最后一次值
                                }
                            }
                        }
                    },
                    binding: {
                        type: 'object',
                        properties: {
                            serverNO: {type: 'number', required: true},
                            classID: {type: 'number', required: true},
                            id: {type: 'number', required: true},
                            pointIndex: {type: 'number', required: true}
                        }
                    }
                }
            }
        }
    }
};