/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var AlarmLevel = require('../../../definition/alarm_level');
var uiclassID = require('../../../definition/uiClassID');

var cfgKey = require('./../definition/system_config_key');
var OrderAction = require('./../definition/order_action_type');
var OrderState = require('./../definition/order_state');
var NotifyTag = require('./../definition/notify_tag');
var AlarmOrder = require('../../../objects/order/AlarmOrder');

var operatorHelper = require('./operator_helper');
var orderNotifyProcessor = require('./order_notify_processor');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db/index');
var ramdb = db.ramdb;

var dbOrder = db.order;
var dbObjID = db.objID;
var dbAlarm = db.alarm;

var rdbOrder = ramdb.order;
var nor = ramdb.nor;
var cfg = db.ramdb.cfg;

//生成工单
function _gen_order(order, callback) {
    dbObjID.gen_object_id('order', function (err, id) {
        if(err){
            callback(err);
            return;
        }
        order.id = id;

        order.insert_db(function (err) {
            if(err){
                callback(err);
                return;
            }

            //更新缓存
            rdbOrder.set_order(order);

            var cfg = ramdb.cfg.get_system_config(cfgKey.alarm);
            var users = operatorHelper.get_on_duty(order.group);

            orderNotifyProcessor.notify_immediately(order, users, NotifyTag.init, cfg ? cfg.option: undefined);
            notifyHelper.send_notify(new NotifyMsg(NotifyType.order_generated, {serverNO: order.serverNO, classID: order.classID, id: order.id, alarm: order.restData.alarm}));

            callback();
        })
    });
}

function process_alarm_gen(alarm) {
    var order = rdbOrder.get_alarm_order(alarm.serverNO, alarm.id);
    if(order){
        logger.warn('alarm: %d has gen order', alarm.id);
        return;
    }

    var name_format = undefined;
    var configItem = undefined;

    var alarm_gen_config = cfg.get_system_config(cfgKey.alarm_order_rule);
    var item = undefined;
    if(alarm_gen_config){
        name_format = alarm_gen_config.name;
        var source = alarm.source;

        var deviceServerNO = source.serverNO;
        var deviceClassID = source.classID;
        var deviceID = source.id;
        var alarmClassID = alarm.classID;
        var alarmLevel = alarm.level;

        for(var i=0;i<alarm_gen_config.list.length;i++){
            var item = alarm_gen_config.list[i];

            if(item.alarmLevel != undefined && item.alarmLevel != alarmLevel){
                continue;
            }
            if(item.alarmClassID != undefined && item.alarmClassID.indexOf(alarmClassID) < 0){
                continue;
            }
            if(item.deviceClassID != undefined && item.deviceClassID.indexOf(deviceClassID) < 0){
                continue;
            }
            var _region = item.region;
            if(_region != undefined){
                if(deviceClassID >= uiclassID.device && deviceClassID <= uiclassID.lastDevice){
                    var parent = nor.get_parent_identity(deviceServerNO, deviceClassID, deviceID, _region.classID);
                    if(!parent || parent.id != _region.id){
                        continue;
                    }
                }else{//故障告警
                    if(_region.classID == deviceClassID){
                        if(!region.id == deviceID){
                            continue;
                        }
                    }else{
                        var parent = nor.get_parent_identity(deviceServerNO, deviceClassID, deviceID, _region.classID);
                        if(!parent || parent.id != _region.id){
                            continue;
                        }
                    }
                }
            }

            configItem = item;
            break;
        }
    }

    if(configItem){
        var now = new Date();

        var dupInterval = undefined;
        var _alarm_config = cfg.get_system_config(cfgKey.alarm);
        if(_alarm_config){
            dupInterval = _alarm_config.dupInterval;
        }
        if(dupInterval){
            var exists = rdbOrder.has_alarm_order_from(alarm.source, now.getTime() - dupInterval * 60 * 1000);
            if(exists){
                logger.warn('alarm: %d has gen order in dup interval: %d', alarm.id, dupInterval);
                return;
            }
        }

        // var device = ramdb.no.get_by_identity(alarm.source);
        var source = alarm.source;
        var deviceName = undefined;
        var region = undefined;
        if(source){
            if(source.classID >= uiclassID.device && source.classID <= uiclassID.lastDevice){//如果是设备，取其所在区域
                var device = ramdb.no.get_by_identity(source);
                if(device){
                    deviceName = device.fullName;
                }
                region = ramdb.nor.get_parent_area_identity(source.serverNO, source.classID, source.id);
            }else if(source.classID >= uiclassID.area && source.classID <= uiclassID.lastArea){
                region = {serverNO: source.serverNO, classID: source.classID, id: source.id};
            }
        }
        if(!region){
            region = {serverNO: source.serverNO, classID: source.classID, id: source.id};
        }

        var order = new AlarmOrder();

        order.region = region;
        order.name = alarm.desc;
        if(name_format){
            order.fullName = name_format.replace('{DeviceName}', deviceName).replace('{AlarmDesc}', alarm.desc).replace('{AlarmLevel}', AlarmLevel.getText(alarm.level));
        }else{
            order.fullName = alarm.desc;
        }
        order.level = alarm.level;
        order.sponsor = configItem.sponsor;
        // order.recipient = recipient;
        order.group = configItem.group;
        order.step = 1;
        order.state = OrderState.unreceived;

        order.restData = {
            alarm: {
                serverNO: alarm.serverNO,
                classID: alarm.classID,
                id: alarm.id
            },
            source: alarm.source,
            desc: alarm.desc,
            startTime: new Date(alarm.startTime)
        };
        if(alarm.endTime){
            order.restData.endTime = new Date(alarm.endTime);
        }
        order.operationList = [{action: OrderAction.send, user: configItem.sponsor, step: order.step, time: now}];

        order.sendTime = now;
        order.startTime = now;
        order.createTime = now;

        _gen_order(order, function (err) {
            if(err){
                logger.error({msg: 'gen order failed', order: order, err: err});
                return;
            }

            // logger.debug('gen order: %j', order);
            //更新告警信息
            dbAlarm.set_related_order(alarm.serverNO, alarm.classID, alarm.id, {serverNO: order.serverNO, classID: order.classID, id: order.id}, function (err) {
                if(err) logger.error({msg: 'update alarm order info failed', alarm: {serverNO: alarm.serverNO, classID: alarm.classID, id: alarm.id}, order: {serverNO: order.serverNO, classID: order.classID, id: order.id}, err: err});
            })
        });
    }
}

function process_alarm_end(data) {
    var serverNO = data.serverNO || defaultServerNO;
    var alarmID = data.id;
    var order = rdbOrder.get_alarm_order(serverNO, alarmID);
    if(!order){
        return;
    }

    var endTime = data.option.time;
    dbOrder.update_alarm_order(order.serverNO, order.classID, order.id, endTime, function (err) {
        if(err){
            logger.error({msg: 'alarm end update order end time failed', err: err});
        }
        order.restData.endTime = endTime;
    });
}

module.exports.process_alarm_gen = process_alarm_gen;
module.exports.process_alarm_end = process_alarm_end;