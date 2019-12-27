/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var objectHelper = require('../../../objects/object_helper');

function order_adapter() {
    var self = this;

    self.tb_name = 'order';

    self.order_dic = {};
    self.order_array = [];
    self.alarm_order_dic = {};
}

util.inherits(order_adapter, table_adapter);

order_adapter.prototype.init = function (param, callback) {
    var self = this;

    var dbOrder = require('../../index').order;
    var OrderState = require('../../../modules/order/definition/order_state');

    dbOrder.find_order({state: {$ne: OrderState.finished}}, {_id: 0}).sort({createTime: 1}).toArray(function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];

                var _order = objectHelper.createNameObject(item.classID);
                if (!_order) {
                    logger.error({msg: 'init device info failed', info: item});
                    continue;
                }
                _order.init_from_row(item);
                self.set_order(_order);
            }
        }

        callback();
    });
};

order_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.order_dic = {};
    self.order_array = [];
    self.alarm_order_dic = {};

    self.init(callback);
};

order_adapter.prototype.set_order = function (order) {
    if(!this.order_dic[order.serverNO]){
        this.order_dic[order.serverNO] = {};
    }
    var exists = this.order_dic[order.serverNO][order.id];
    this.order_dic[order.serverNO][order.id] = order;

    if(!exists){
        this.order_array.push(order);
    }else{
        throw new Error()
    }

    if(order.classID == uiclassID.alarmOrder){
        var _alarm = order.restData.alarm;
        if(_alarm){
            if(!this.alarm_order_dic[_alarm.serverNO]){
                this.alarm_order_dic[_alarm.serverNO] = {};
            }
            this.alarm_order_dic[_alarm.serverNO][_alarm.id] = order;
        }
    }
};

order_adapter.prototype.del_order = function (order) {
    if(this.order_dic[order.serverNO]){
        delete this.order_dic[order.serverNO][order.id];
    }
    var index = this.order_array.indexOf(order);
    if(index >= 0){
        this.order_array.splice(index, 1);
    }
    
    if(order.classID == uiclassID.alarmOrder){
        var _alarm = order.restData.alarm;
        if(_alarm && this.alarm_order_dic[_alarm.serverNO]){
            delete this.alarm_order_dic[_alarm.serverNO][_alarm.id];
        }
    }
};

order_adapter.prototype.get_order_sync = function (serverNO, classID, id) {
    if(this.order_dic[serverNO]){
        return this.order_dic[serverNO][id];
    }
    return undefined;
};

order_adapter.prototype.get_alarm_order = function (serverNO, alarmID) {
    if(this.alarm_order_dic[serverNO]){
        return this.alarm_order_dic[serverNO][alarmID];
    }
    return undefined;
};

order_adapter.prototype.has_alarm_order_from = function (source, since) {
    var has = false;

    for(var i=0;i<this.order_array.length;i++){
        var order = this.order_array[i];
        if(order.classID == uiclassID.alarmOrder){
            var _source = order.restData.source;
            if(_source.serverNO == source.serverNO && _source.classID == source.classID && _source.id == source.id && _source.pointIndex == source.pointIndex){
                has = order.startTime.getTime() > since;
                if(has){
                    break;
                }
            }
        }
    }

    return has;
};

order_adapter.prototype.get_all_order = function () {
    return this.order_array;
};

module.exports = order_adapter;