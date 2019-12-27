/**
 * Created by wangxh on 2017/10/12.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');
var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var cfg = require('../../index').cfg;
var area_config = require('../../index').areaAlarmConfig;
var serverType = require('../../../definition/service_type');

function system_config_adapter() {
    var self = this;

    self.tb_name = 'system_config';

    self.cfg_dic = {};
}

util.inherits(system_config_adapter, table_adapter);

system_config_adapter.prototype.init = function (param, callback) {
    var self = this;
    var system = param.system;

    cfg.find_system_config(param || {}, {}, function (err, result) {
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];
                self.set_system_config(item.key, item.value);
            }
        }
        if (system == serverType.alarm){
            area_config.find_all_area_config(function (err,res) {
                if (err){
                    callback(err);
                    return;
                }
                if (res){
                    self.cfg_dic[sysConfigKey.alarm_notify_config] = [];
                    self.cfg_dic[sysConfigKey.schedule_alarm_config] = {};
                    self.cfg_dic[sysConfigKey.alarm_notify_rule_config] = [];
                    for (var j = 0; j < res.length; j ++){
                        var _area_config = res[j];
                        if (_area_config.serverNO == 0 && _area_config.classID == 0 && _area_config.id == 0){
                            self.cfg_dic[sysConfigKey.alarm_notify_config] = _area_config.alarm_notify_config;
                            self.cfg_dic[sysConfigKey.schedule_alarm_config] = _area_config.schedule_alarm_config;
                        }
                        self.cfg_dic[sysConfigKey.alarm_notify_rule_config].push(_area_config.alarm_notify_rule_config);
                        // self.cfg_dic[sysConfigKey.alarm_notify_config][_area_config.id] = _area_config.alarm_notify_config;
                        // self.cfg_dic[sysConfigKey.schedule_alarm_config][_area_config.id] = _area_config.schedule_alarm_config;
                        // if (_area_config.alarm_notify_rule_config){
                        //     self.cfg_dic[sysConfigKey.alarm_notify_rule_config].push(_area_config.alarm_notify_rule_config);
                        // }
                    }
                }
                callback();
            })
        }
        else{
            callback()
        }

    });

};

system_config_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.cfg_dic = {};

    self.init(callback);
};

system_config_adapter.prototype.set_system_config = function (key, value) {
    this.cfg_dic[key] = value;
};

system_config_adapter.prototype.set_area_system_config = function (key, id, value) {
    if (this.cfg_dic[key]){
        this.cfg_dic[key][id] = value;
    }
    else {
        this.cfg_dic[key] = {};
        this.cfg_dic[key][id] = value;
    }
    // this.cfg_dic[key] = value;
};


system_config_adapter.prototype.get_system_config = function (key) {
    return this.cfg_dic[key];
};

module.exports = system_config_adapter;