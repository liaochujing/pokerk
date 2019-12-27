/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;

var deviceHelper = require('../../../helpers/device_helper');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');
var interfaceHelper = require('../../../protocol/central/interface_helper');

var OrderState = require('../../../modules/order/definition/order_state');
var OperatorState = require('../../../definition/operator_state');
// var AlarmAction = require('../../../modules/alarm/definition/alarm_action');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;

    var dbAlarm = db.alarm;
    var dbOrder = db.order;
    var dbDP = db.dp;
    var dbHisAlarm = db.datadb.hisalarm;
    var dbAlarmLog = db.datadb.aml;
    var ramdb = db.ramdb;

    var alarm = undefined;
    var device = undefined;
    var point = undefined;
    var points = undefined;
    var aType = undefined;
    var order = undefined;
    var maintain = undefined;
    var children = undefined;
    var relative = undefined;
    var counts = undefined;
    var _data = undefined;
    var logs = undefined;

    var get_alarm_info = function (done) {
        dbAlarm.findOne(body, {_id: 0, time: 0}, function (err, data) {
            if(err) return done(err);

            if(data){
                alarm = {
                    serverNO: data.serverNO,
                    classID: data.classID,
                    id: data.id,
                    source: data.source,
                    level: data.level,
                    desc: data.desc,
                    startTime: data.startTime,
                    start: data.start,
                    endTime: data.endTime,
                    end: data.end,
                    force: data.force,
                    confirmed: data.confirmed,
                    hangup: data.isHangup,
                    order: data.order
                };
                if(data.star){
                    alarm.star = data.star[user.id] || 0;
                }else{
                    alarm.star = 0;
                }
                done();
            }else{
                callback({status: code.not_found, msg: 'alarm not found'});
            }
        })
    };

    var get_point_info = function (done) {
        var _source = alarm.source;
        if(_source){
            var _device = ramdb.no.get_by_identity(_source);
            if(_device){
                var model = undefined;
                var brand = undefined;
                var pdDate = undefined;
                var asset = ramdb.asset.get_asset_sync(_device.aNO);
                if(asset){
                    model = asset.model;
                    brand = asset.brand;
                    pdDate = asset.pdDate;
                }
                device = {
                    serverNO: _device.serverNO,
                    classID: _device.classID,
                    id: _device.id,
                    name: _device.fullName,
                    path: deviceHelper.get_device_path(_device),
                    aNO: _device.aNO,
                    model: model,
                    brand: brand,
                    pdDate: pdDate
                }
            }
            dbDP.findOne({deviceServerNO: _source.serverNO, deviceClassID: _source.classID, deviceID: _source.id, pointIndex: _source.pointIndex}, {deviceServerNO: 1, deviceClassID: 1, deviceID: 1, pointIndex: 1, fullName: 1, unit: 1, 'config.value': 1}, function (err, data) {
                if(err) return done(err);

                if(data){
                    point = {serverNO: data.deviceServerNO, classID: data.deviceClassID, id: data.deviceID, pointIndex: data.pointIndex, name: data.fullName, unit: data.unit};
                    if(data.config && data.config.value && data.config.value.expression){
                        var formual = data.config.value.expression.formula;
                        if(formual){
                            formual = formual.replace(/\s/g, '');
                            var _ss = data.config.value.expression.source;
                            if(_ss && _ss.length > 0){
                                for(var i=0;i<_ss.length;i++){
                                    var _item = _ss[i];

                                    var serverNO = _item.serverNO || data.deviceServerNO;
                                    var classID = _item.classID || data.deviceClassID;
                                    var id = _item.id || data.deviceID;
                                    var pointIndex = _item.pointIndex;

                                    var pointName = undefined;
                                    var _d = ramdb.no.get_no_sync(serverNO, classID, id);
                                    if(_d){
                                        var _p = ramdb.dep.get_device_type_point(_d.type, pointIndex);
                                        if(_p){
                                            pointName = _p.name;
                                        }
                                    }

                                    if(pointName){
                                        formual = formual.replace(new RegExp('GetPointValue\\(' + serverNO + ',' + id + ',' + pointIndex + '\\)', 'gm'), pointName);
                                    }
                                }
                            }
                            point.formual = formual;
                        }
                    }
                    if(!point.formual){
                        point.formual = point.name;
                    }
                }
                if(point){
                    done();
                }else{
                    done();
                }
            })
        }else{
            done();
        }
    };
    
    var get_point_value = function (done) {
        if(point){
            var identitys = {};
            identitys[point.id] = [point.pointIndex];

            interfaceHelper.get_point_value(point.serverNO, identitys, function (err, data) {
                if(err) logger.error({msg: 'get point data failed', err: err});
                if(data){
                    if(data[point.id]){
                       point.pointValue = data[point.id][point.pointIndex];
                    }
                }
                done();
            })
        }else{
            done();
        }
    };

    var get_alarm_type = function (done) {
        aType = ramdb.alp.get_alarm_type(alarm.classID);
        done();
    };

    var get_order = function (done) {
        if(alarm.order){
            db.order.findOne(alarm.order, {_id: 0, serverNO: 1, classID: 1, id: 1, name: 1, fullName: 1, recipient: 1, group: 1, startTime: 1, step: 1, state: 1}, function (err, data) {
                if(err) logger.error({msg: 'get_order', err: err});
                if(data){
                    order = {
                        serverNO: data.serverNO,
                        classID: data.classID,
                        id: data.id,
                        name: data.name,
                        fullName: data.fullName,
                        recipient: data.recipient,
                        group: data.group,
                        startTime: data.startTime,
                        step: data.step,
                        state: data.state
                    };
                }
                if(order){
                    if(order.recipient){
                        var _recipient = ramdb.oo.get_operator_by_id(order.recipient);
                        if(_recipient){
                            order.recipientName = _recipient.fullName;
                        }
                    }
                    if(order.group){
                        var _group = ramdb.oo.get_group_by_id(order.group);
                        if(_group){
                            order.groupName = _group.fullName;
                            order.onDutyName = '';
                            var operators = ramdb.oor.get_child_identity(_group.serverNO, _group.classID, _group.id);
                            if(operators){
                                for(var i=0;i<operators.length;i++){
                                    var operator = ramdb.oo.get_by_identity(operators[i]);
                                    if(operator && operator.state == OperatorState.onDuty){
                                        if(order.onDutyName){
                                            order.onDutyName += '、';
                                        }
                                        order.onDutyName+=operator.fullName;
                                    }
                                }
                            }
                        }
                    }
                }
                done();
            })
        }else{
            done();
        }
    };
    
    var get_maintain = function (done) {
        if(!device || !device.aNO){
            done();
            return;
        }

        //最近三个月
        var query = {startTime: {$gte: new Date().AddMonth(-3)}, state: OrderState.finished};

        query.classID = uiclassID.assetOrder;
        query['restData.asset.aNO'] = device.aNO;

        dbOrder.find_order(query, {_id: 0, serverNO: 1, classID: 1, id: 1, startTime: 1, 'restData.planTime': 1, 'restData.mTime': 1, 'restData.maintain': 1, 'restData.type': 1}, function (err, results) {
            if(err) return callback({status: code.unknown, msg: 'find order failed'});

            if(results){
                var _list = [];
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    _list.push({
                        serverNO: item.serverNO,
                        classID: item.classID,
                        id: item.id,
                        startTime: item.startTime,
                        restData: item.restData
                    })
                }
                maintain = _list;
            }

            done();
        });
    };

    var get_child_alarm = function (done) {
        dbAlarm.aggregate([
            {$match: {'parent.serverNO': body.serverNO, 'parent.classID': body.classID, 'parent.id': body.id}},
            {$project: {
                i: {serverNO: '$serverNO', classID: '$classID', id: '$id'},
                s: '$source',
                d: '$desc',
                st: '$startTime'
            }}
        ], function(err, results){
            if(err) logger.error({msg: 'get child alarm failed', err: err});
            children = results;
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    if(item.st){
                        item.st = item.st.to_unix();
                    }
                }
            }
            done();
        });
    };

    var get_relative_alarm = function (done) {
        if(device){
            dbAlarm.aggregate([
                {$match: {'source.serverNO': device.serverNO, 'source.classID': device.classID, 'source.id': device.id}},
                {$project: {
                    i: {serverNO: '$serverNO', classID: '$classID', id: '$id'},
                    s: '$source',
                    d: '$desc',
                    st: '$startTime',
                    p: '$parent',//收敛
                    o: '$order'//工单
                }}
            ], function (err, results) {
                if(err) logger.error({msg: 'get relative alarm failed', err: err});
                relative = results;
                if(results){
                    var index = undefined;
                    for(var i=0;i<results.length;i++){
                        var item = results[i];
                        delete item._id;
                        if(item.st){
                            item.st = item.st.to_unix();
                        }
                        if(item.i.id == alarm.id){
                            index = i;
                        }
                    }
                    if(index != undefined){
                        results.splice(index, 1);
                    }
                }
                done();
            });
        }else{
            done();
        }
    };

    var get_operation_log = function (done) {
        done();

        // dbAlarmLog.find_log({serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id, time: {$gt: alarm.startTime}}, {_id: 0, user: 1, action: 1, data: 1, time: 1}, function (err, results) {
        //     if(err) logger.error({msg: 'get_log', err: err});
        //
        //     var rdbOO = ramdb.oo;
        //     if(results){
        //         logs = [];
        //         for(var i=0;i<results.length;i++){
        //             var item = results[i];
        //             var user = rdbOO.get_operator_by_id(item.user);
        //             logs.push({
        //                 user: user ? user.fullName : '未知',
        //                 action: item.action,
        //                 data: item.data,
        //                 time: item.time
        //             })
        //         }
        //     }
        //
        //     done();
        // })
    };

    var get_alarm_count = function (done) {
        var _source = alarm.source;
        var get_alarm_count = function (from, to, cb) {
            dbAlarm.count({'source.serverNO': _source.serverNO, 'source.classID': _source.classID, 'source.id': _source.id, 'source.pointIndex': _source.pointIndex, startTime: {$gte: from, $lt: to}}, function (err, count) {
                if(err) logger.error({msg: 'get alarm count', err: err});
                cb(null, count);
            })
        };
        var get_his_alarm_count = function (from, to, cb) {
            dbHisAlarm.count({'source.serverNO': _source.serverNO, 'source.classID': _source.classID, 'source.id': _source.id, 'source.pointIndex': _source.pointIndex, startTime: {$gte: from, $lt: to}}, function (err, count) {
                if(err) logger.error({msg: 'get alarmm count', err: err});
                cb(null, count);
            })
        };
        var get_day_count = function (cb) {
            var from = new Date().GetDate();
            var to = new Date();
            ah.parallel([function (next) {
                get_alarm_count(from, to, next);
            }, function (next) {
                get_his_alarm_count(from, to, next);
            }], function (err, res) {
                if(err) return cb(err);
                cb(null, res[0] + res[1]);
            })
        };
        var get_week_count = function (cb) {
            var from = new Date().GetDate().AddDays(1 - new Date().getDay());
            var to = new Date();
            ah.parallel([function (next) {
                get_alarm_count(from, to, next);
            }, function (next) {
                get_his_alarm_count(from, to, next);
            }], function (err, res) {
                if(err) return cb(err);
                cb(null, res[0] + res[1]);
            })
        };
        var get_mon_count = function (cb) {
            var from = new Date().GetMonth();
            var to = new Date();
            ah.parallel([function (next) {
                get_alarm_count(from, to, next);
            }, function (next) {
                get_his_alarm_count(from, to, next);
            }], function (err, res) {
                if(err) return cb(err);
                cb(null, res[0] + res[1]);
            })
        };

        ah.parallel([get_day_count, get_week_count, get_mon_count], function (err, res) {
            if(err) logger.error({msg: 'xx', err: err});
            if(res){
                counts = {day: res[0], week: res[1], mon: res[2]};
            }

            done();
        })
    };

    var get_his_data = function (done) {
        if(point){
            points = [];

            var expression = undefined;
            if(point.config && point.config.value && point.config.value.expression){
                expression = point.config.value.expression;
            }
            if(expression && expression.source.length > 0){
                for(var i=0;i<expression.source.length;i++){
                    var item = expression.source[i];
                    var serverNO = item.serverNO || point.serverNO;
                    var classID = item.classID || point.classID;
                    var id = item.id || point.id;
                    var pointIndex = item.pointIndex;

                    points.push({serverNO: serverNO, classID: classID, id: id, pointIndex: pointIndex});
                }
            }else{
                points.push({serverNO: point.serverNO, classID: point.classID, id: point.id, pointIndex: point.pointIndex});
            }

            done();
            // var startTime = alarm.startTime.AddHours(-12);
            // var endTime = alarm.startTime.AddHours(12);
            // var msg = new DataMessage(CentralCMD.cen_0x00030001, {points: points, startTime: startTime.format_datetime(), endTime: endTime.format_datetime()});
            // dataHelper.send(msg, function (err, data) {
            //     if(err) logger.error({msg: 'get point data failed', err: err});
            //
            //     if(data){
            //         for(var i=0;i<data.length;i++){
            //             var _item = data[i];
            //
            //             var device = ramdb.no.get_no_sync(_item.serverNO, _item.classID, _item.id);
            //             if(device){
            //                 var _p = ramdb.dep.get_device_type_point(device.type, _item.pointIndex);
            //                 if(_p){
            //                     _item.name = _p.name;
            //                     _item.unit = _p.unit;
            //                 }
            //             }
            //         }
            //     }
            //     _data = data;
            //
            //     done();
            // });
        }else{
            done();
        }
    };

    ah.series([get_alarm_info, get_point_info], function (err) {
        if(err) return callback(err);
        ah.parallel([get_point_value, get_alarm_type, get_child_alarm, get_relative_alarm, get_order, get_maintain, get_operation_log, get_alarm_count, get_his_data], function (err) {
            if(err) logger.error({msg: 'step two', err: err});
            callback(null, {alarm: alarm, device: device, point: point, points: points, aType: aType || null, order: order || null, maintain: maintain || null, children: children || null, relative: relative || null, counts: counts || null, data: _data || null, logs: logs || null});
        })
    });
}

module.exports.cmd = cmd.alm_0x00020006;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};