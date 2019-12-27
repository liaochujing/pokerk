/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');

var AlarmClass = require('../../../definition/alarm_class');
var Alarm = require('../../../objects/alarm/Alarm');
var alarm_level = require('../../../definition/alarm_level');

var a = require('../../index').alarm;

function alarm_adapter() {
    var self = this;

    self.tb_name = 'alarm';

    self.alarm_dic = {};
    self.device_dic = {};
}

util.inherits(alarm_adapter, table_adapter);

alarm_adapter.prototype.init = function (param, callback) {
    param = param || {};
    var self = this;

    var query = param.query || {classID: {$not: {$gte: AlarmClass.third_party_event, $lte: AlarmClass.last_third_party_event}}};
    query.isEnd = {$ne: 1};
    query.level = {$gt: alarm_level.event};
    var fields = param.fields || {};

    self._query = query;
    self._fields = fields;

    a.find_all_alarm(query, fields, function(result){
        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];
                var alarm = new Alarm();
                alarm.init_from_row(item);
                self.set_alarm(alarm);
            }
        }
    }, function (err) {
        if (err) return callback(err);
        callback();
    });
};

alarm_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.alarm_dic = {};
    self.device_dic = {};

    self.init({query: self._query, fields: self._fields}, callback);
};

alarm_adapter.prototype.set_alarm = function (alarm) {
    var source = alarm.source;
    if(alarm.level > alarm_level.event){
        var _item = this.alarm_dic[alarm.serverNO];
        if(_item == undefined){
            _item = {};
            this.alarm_dic[alarm.serverNO] = _item
        }
        _item[alarm.id] = alarm;

        var key = source.id;
        if(key != undefined){
            var _item1 = this.device_dic[key];
            if(_item1 == undefined){
                _item1 = {};
                this.device_dic[key] = _item1
            }
            if(_item1[source.pointIndex] == undefined){
                _item1[source.pointIndex] = {};
            }
            _item1[source.pointIndex][alarm.classID] = alarm;
        }
    }
};

alarm_adapter.prototype.del_alarm = function (serverNO, classID, id) {
    var alarm = undefined;
    var _item = this.alarm_dic[serverNO];
    if(_item != undefined){
        alarm = _item[id];
        if(alarm != undefined){
            delete _item[id];

            var source = alarm.source;
            if(source != undefined){
                var deviceItem = this.device_dic[source.id];
                if(deviceItem != undefined){
                    var _item_pt = deviceItem[source.pointIndex];
                    if(_item_pt != undefined){
                        delete _item_pt[classID];
                    }
                }
            }
        }
    }

    return alarm;
};

alarm_adapter.prototype.get_alarm_by_point = function (serverNO, classID, id, pointIndex, alarm_classID) {
    let _alarm_classID = alarm_classID || 0;

    var _tmp = this.device_dic[id];
    if(_tmp != undefined){
        let temp = _tmp[pointIndex];
        if(temp != undefined){
            return temp[_alarm_classID];
        }
    }

    return undefined;
};

alarm_adapter.prototype.get_alarm_sync = function (serverNO, classID, id) {
    var _tmp = this.alarm_dic[serverNO];
    if(_tmp){
        return _tmp[id];
    }
    return undefined;
};

alarm_adapter.prototype.get_all_alarm = function () {
    var result = [];
    for(var i in this.alarm_dic){
        var serverItem = this.alarm_dic[i];
        for(var j in serverItem){
            result.push(serverItem[j]);
        }
    }
    return result;
};

module.exports = alarm_adapter;