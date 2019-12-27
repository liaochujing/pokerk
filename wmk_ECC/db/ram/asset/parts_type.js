/**
 * Created by wangxh on 2017/11/3.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');
var dbPST = require('../../index').pst;

function parts_type_adapter() {
    var self = this;

    self.tb_name = 'parts_type';

    self.typeDic = {};
}

util.inherits(parts_type_adapter, table_adapter);

parts_type_adapter.prototype.init = function (param, callback) {
    var self = this;
    dbPST.find_parts_type({}, {}, function (err, result) {
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
                    createTime: type.createTime,
                    modifyTime: type.modifyTime
                });
            }
        }

        callback();
    });
};

parts_type_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.typeDic = {};

    self.init(callback);
};

parts_type_adapter.prototype.set_type = function (type) {
    this.typeDic[type.id] = type;
};

parts_type_adapter.prototype.get_type = function (id) {
    return this.typeDic[id];
};

parts_type_adapter.prototype.del_type = function (id) {
    delete this.typeDic[id]
};

parts_type_adapter.prototype.get_all_parts_type = function () {
    var res = [];

    for(var i in this.typeDic){
        res.push(this.typeDic[i]);
    }

    return res;
};

module.exports = parts_type_adapter;