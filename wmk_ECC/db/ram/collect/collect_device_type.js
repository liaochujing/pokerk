/**
 * Created by wangxh on 2017/11/24.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');

var dbCDT = require('../../index').cdt;

function collect_device_type_adapter() {
    var self = this;

    self.tb_name = 'collect_device_type';

    self.typeDic = {};
}

util.inherits(collect_device_type_adapter, table_adapter);

collect_device_type_adapter.prototype.init = function (param, callback) {
    var self = this;
    dbCDT.find_collect_device_type({}, {}, function (err, result) {
        if(err){
            callback(err);
            return;
        }
        if(result){
            for(var i=0;i<result.length;i++){
                var type = result[i];
                self.set_type({
                    id: type.id,
                    name: type.name,
                    desc: type.desc,
                    pointList: type.pointList,
                    config: type.config,
                    data: type.data,
                    time: type.time
                });
            }}
        callback();
    });
};

collect_device_type_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.typeDic = {};

    self.init(callback);
};

collect_device_type_adapter.prototype.set_type = function (type) {
    var self = this;


    self.typeDic[type.id] = type;
};

collect_device_type_adapter.prototype.del_type = function (type) {
    var self = this;

    delete self.typeDic[type.id];
};

collect_device_type_adapter.prototype.reset = function (types) {
    this.typeDic = {};

    if(types && types.length > 0){
        for(var i=0;i<types.length;i++){
            var type = types[i];
            this.set_type(type);
        }
    }
};

collect_device_type_adapter.prototype.get_collect_device_type = function (id) {
    return this.typeDic[id];
};

collect_device_type_adapter.prototype.get_all_collect_device_type = function () {
    var res = [];

    for(var i in this.typeDic){
        res.push(this.typeDic[i]);
    }

    return res;
};

collect_device_type_adapter.prototype.get_collect_device_type_point = function (id, pointIndex) {
    var _template = this.typeDic[id];
    var _point = undefined;
    if(_template && _template.pointList){
        for(var i=0;i<_template.pointList.length;i++){
            var _p = _template.pointList[i];
            if(_p.pointIndex == pointIndex){
                _point = _p;
                break;
            }
        }
    }
    return _point;
};

module.exports = collect_device_type_adapter;