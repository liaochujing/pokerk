/**
 * Created by wangxh on 2017/11/3.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');

var dbAST = require('../../index').ast;

function asset_type_adapter() {
    var self = this;

    self.tb_name = 'asset_type';

    self.assetTypeDic = {};
}

util.inherits(asset_type_adapter, table_adapter);

asset_type_adapter.prototype.init = function (param, callback) {
    var self = this;
    dbAST.find_asset_type({}, {}, function (err, result) {
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var type = result[i];

                self.set_type({
                    system: type.system,
                    groups: type.groups,
                    name: type.name,
                    desc: type.desc
                });
            }
        }
        callback();
    });
};

asset_type_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.assetTypeDic = {};

    self.init(callback);
};

asset_type_adapter.prototype.set_type = function (type) {
    var self = this;

    self.assetTypeDic[type.system] = type;
};

asset_type_adapter.prototype.del_type = function (type) {
    var self = this;
    delete self.assetTypeDic[type.system]
};

asset_type_adapter.prototype.reset = function (types) {
    this.assetTypeDic = {};
    
    if(types && types.length > 0){
        for(var i=0;i<types.length;i++){
            var type = types[i];
            this.set_type(type);
        }
    }
};

asset_type_adapter.prototype.get_all_asset_type = function () {
    var res = [];

    for(var i in this.assetTypeDic){
        res.push(this.assetTypeDic[i]);
    }

    return res;
};

module.exports = asset_type_adapter;