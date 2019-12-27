/**
 * Created by wangxh on 2017/9/27.
 */

'use strict';


var util = require('util');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('./../../../definition/uiClassID');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');

var dbALP = require('../../index').alp;

function alarmtype_adapter() {
    var self = this;

    self.tb_name = 'alarmtype';

    self.ac_dic = {};
}

util.inherits(alarmtype_adapter, table_adapter);

alarmtype_adapter.prototype.init = function (param, callback) {
    var self = this;

    dbALP.find_alarm_type({}, {}, function (err, result) {
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];

                var _aType = {id: item.id, name: item.name, condition: item.condition, option: item.option, config: item.config, time: item.time};
                self.set_alarm_type(_aType);
            }
        }

        callback();
    });
};

alarmtype_adapter.prototype.set_alarm_type = function (alarmType) {
    this.ac_dic[alarmType.id] = alarmType;
};

alarmtype_adapter.prototype.del_alarm_type = function (id) {
    var alp = this.ac_dic[id];
    delete this.ac_dic[id];
    return alp
};

alarmtype_adapter.prototype.get_alarm_type = function (id) {
    return this.ac_dic[id];
};

alarmtype_adapter.prototype.get_all_alarm_type = function () {
    var res = [];

    for(var i in this.ac_dic){
        var item = this.ac_dic[i];
        res.push(item);
    }

    return res;
};

module.exports = alarmtype_adapter;