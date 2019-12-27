/**
 * Created by wangxh on 2019/2/26.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');

var dbLC = require('../../index').lc;

function link_control_adapter() {
    var self = this;

    self.tb_name = 'link_control';

    self.lc_dic = {};
}

util.inherits(link_control_adapter, table_adapter);

link_control_adapter.prototype.init = function (param, callback) {
    var self = this;
    dbLC.find_link_control({}, {_id: 0}, function (err, result) {
        if(err){
            callback(err);
            return;
        }
        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];
                self.set_link_control({
                    id: item.id,
                    type: item.type,
                    name: item.name,
                    option: item.option,
                    enabled: item.enabled,
                    time: item.time
                });
            }}
        callback();
    });
};

link_control_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.lc_dic = {};

    self.init(callback);
};

link_control_adapter.prototype.set_link_control = function (lc) {
    this.lc_dic[lc.id] = lc;
};

link_control_adapter.prototype.get_link_control = function (id) {
    return this.lc_dic[id];
};

link_control_adapter.prototype.del_link_control = function (id) {
    delete this.lc_dic[id];
};

link_control_adapter.prototype.get_link_control_list = function () {
    var list = [];
    for(var key in this.lc_dic){
        list.push(this.lc_dic[key]);
    }
    return list;
};

module.exports = link_control_adapter;