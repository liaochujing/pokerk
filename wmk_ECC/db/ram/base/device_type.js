/**
 * Created by wangxh on 2017/11/3.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');

var dbDEP = require('../../index').dep;

function devicetype_adapter() {
    var self = this;

    self.tb_name = 'device_type';

    self.aTypeDic = {};
}

util.inherits(devicetype_adapter, table_adapter);

devicetype_adapter.prototype.init = function (param, callback) {
    var self = this;
    dbDEP.find_device_type({}, {}, function (err, result) {
        if(err){
            callback(err);
            return;
        }
        if(result){
            for(var i=0;i<result.length;i++){
                var type = result[i];
                self.set_type({
                    system: type.system,
                    systemName: type.systemName,
                    group: type.group,
                    groupName: type.groupName,
                    id: type.id,
                    name: type.name,
                    desc: type.desc,
                    pointList: type.pointList,
                    config: type.config,
                    time: type.time
                });
            }}
        callback();
    });
};

devicetype_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.aTypeDic = {};

    self.init(callback);
};

devicetype_adapter.prototype.set_type = function (type) {
    var self = this;

    if(!self.aTypeDic[type.system]){
        self.aTypeDic[type.system] = {};
    }
    if(!self.aTypeDic[type.system][type.group]){
        self.aTypeDic[type.system][type.group] = {};
    }
    self.aTypeDic[type.system][type.group][type.id] = type;
};


devicetype_adapter.prototype.del_type = function (type) {
    var self = this;

    if(self.aTypeDic[type.system] && self.aTypeDic[type.system][type.group]){
        delete self.aTypeDic[type.system][type.group][type.id];
    }
};

devicetype_adapter.prototype.reset = function (types) {
    this.aTypeDic = {};

    if(types && types.length > 0){
        for(var i=0;i<types.length;i++){
            var type = types[i];
            this.set_type(type);
        }
    }
};

devicetype_adapter.prototype.get_device_type = function (temp) {
    if(temp){
        if(this.aTypeDic[temp.system]){
            if(this.aTypeDic[temp.system][temp.group]){
                return this.aTypeDic[temp.system][temp.group][temp.id];
            }
        }
    }
    return undefined;
};

devicetype_adapter.prototype.get_all_device_type = function () {
    var res = [];

    for(var i in this.aTypeDic){
        var systemItem = this.aTypeDic[i];
        for(var j in systemItem){
            var groupItem = systemItem[j];
            for(var k in groupItem){
                res.push(groupItem[k]);
            }
        }
    }

    return res;
};

devicetype_adapter.prototype.get_device_type_point = function (temp, pointIndex) {
    if(temp){
        var _template = undefined;
        if(this.aTypeDic[temp.system]){
            if(this.aTypeDic[temp.system][temp.group]){
                _template = this.aTypeDic[temp.system][temp.group][temp.id];
            }
        }
        var _point = undefined;
        if(_template){
            for(var i=0;i<_template.pointList.length;i++){
                var _p = _template.pointList[i];
                if(_p.pointIndex == pointIndex){
                    _point = _p;
                    break;
                }
            }
        }
        return _point;
    }
    return undefined;
};

module.exports = devicetype_adapter;