/**
 * Created by wangxh on 2018/6/29.
 */

'use strict';

var util = require('util');
var logger = require('../../../util/log_manager').logger;
var sysConfigKey = require('../definition/system_config_key');

var uiclassID = require('../../../definition/uiClassID');
var AlarmLevel = require('../../../definition/alarm_level');
var OrderAction = require('./../definition/order_action_type');
var OrderState = require('./../definition/order_state');
var NotifyTag = require('./../definition/notify_tag');
var InspectionOrder = require('../../../objects/order/InspectionOrder');

var operatorHelper = require('./operator_helper');
var orderNotifyProcessor = require('./order_notify_processor');

// var notifyHelper = require('../../../protocol/central/notify_helper');
// var NotifyMsg = require('../../../protocol/definition/notify_message');
// var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db');
var rdbCFG = db.ramdb.cfg;
var rdbNO = db.ramdb.no;
var rdbNOR = db.ramdb.nor;
var rdbInspData = db.ramdb.inspection_data;
var rdbOrder = db.ramdb.order;

var dbOrder = db.order;
var dbObjID = db.objID;

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

            callback();
        })
    });
}

function start_process() {
    function gen_order(config) {
        if(config.rooms <= 0){
            return;
        }
        
        var now = new Date();

        //检查工单是否已经生成
        var _nowKey = now.format_minute();
        var order_list = rdbOrder.get_all_order();
        for(var i=0;i<order_list.length;i++){
            var _order = order_list[i];
            if(_order.classID == uiclassID.inspectionOrder && _order.restData.guid == config.guid){
                if(_nowKey == _order.startTime.format_minute()){
                    logger.error({msg: 'try gen order but order is found', config: config});
                    return;
                }
            }
        }
        
        var _roomData = [];
        for(var i=0;i<config.rooms.length;i++){
            var room = rdbNO.get_by_identity(config.rooms[i]);
            if(room){
                var _template = rdbInspData.get_by_identity(room);
                if(_template && _template.data){
                    _roomData.push({serverNO: room.serverNO, classID: room.classID, id: room.id, rmType: room.rmType, data: JSON.parse(JSON.stringify(_template.data))});//拷贝对象
                }else{
                    _roomData.push({serverNO: room.serverNO, classID: room.classID, id: room.id, rmType: room.rmType, data: {}});
                }
            }
        }
        if(_roomData.length <= 0){
            return;
        }

        var region = undefined;
        if(config.rooms.length == 1){
            region = config.rooms[0];
        }else{
            var _serverNO = undefined;
            for(var i=0;i<config.rooms.length;i++){
                var room = config.rooms[i];
                var _parent = rdbNOR.get_parent_identity(room.serverNO, room.classID, room.id, uiclassID.building);
                if(!_parent){
                    logger.error({msg: 'gen order failed, room parent not found', room: room});
                    return;
                }
                if(!region){
                    region = _parent;
                }else{
                    if(region.serverNO != _parent.serverNO || region.classID != _parent.classID || region.id != _parent.id){
                        region = rdbNOR.get_parent_identity(room.serverNO, room.classID, room.id, uiclassID.park);
                        break;
                    }
                }
            }
        }
        var order = new InspectionOrder();

        order.region = region;
        order.name = config.name;
        var _config = rdbCFG.get_system_config(sysConfigKey.inspection);
        if(_config && _config.option){
            order.fullName = _config.option.format.replace('{RuleName}', config.name).replace('{Time}', now.format_datetime());
        }else{
            order.fullName = config.name;
        }
        
        order.level = AlarmLevel.important;
        order.sponsor = config.sponsor;
        order.group = config.group;
        order.step = 1;
        order.state = OrderState.unreceived;

        order.restData = {
            guid: config.guid,
            rooms: _roomData,
            participant: [],
            // mTime: undefined,
            force_next: config.force_next
        };
        order.operationList = [{action: OrderAction.send, user: config.sponsor, step: order.step, time: now}];

        order.sendTime = now;
        order.startTime = now;
        order.createTime = now;

        _gen_order(order, function (err) {
            if(err) logger.error({msg: 'gen schedule order failed', order: order});
        })
    }

    function schedule_next() {
        var now = new Date();
        var day = now.GetDate();
        var interval = now - day;

        var mins = parseInt((interval) / 1000 / 60);//分钟数
        var config = rdbCFG.get_system_config(sysConfigKey.inspection_order_rule);
        if(config && config.length > 0){
            for(var i=0;i<config.length;i++){
                var item = config[i];
                if(item.time.indexOf(mins) >= 0) {
                    try{
                        gen_order(item);
                    }catch(err){
                        logger.error({msg: 'gen order failed', err: err, item: item});
                    }
                }
            }
        }

        var _next = (mins + 1) * 60 * 1000 + 1000;
        setTimeout(function () {
            schedule_next();
        }, _next - interval);
    }

    setTimeout(function () {
        schedule_next();
    }, 3 * 1000)
}

module.exports.start_process = start_process;