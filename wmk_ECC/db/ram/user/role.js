/**
 * Created by wangxh on 2017/11/9.
 */

'use strict';

var util = require('util');
var logger = require('../../../util/log_manager').logger;
var table_adapter = require('../table_adapter');
var dbrole = require('../../index').role;

function role_adapter() {
    var self = this;

    self.tb_name = 'role';

    self.privilege_dic = {};
}

util.inherits(role_adapter, table_adapter);

role_adapter.prototype.init = function (param, callback) {
    var self = this;

    dbrole.find_role({}, {_id: 0}, function(err, result){
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];
                var role = {
                    id: item.id,
                    option: item.option,
                    name: item.name,
                    type: item.type,
                    time: item.time
                };

                self.set_role(role);
            }
        }

        callback();
    });
};

role_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.privilege_dic = {};

    self.init(callback);
};


role_adapter.prototype.set_role = function (data) {
    this.privilege_dic[data.id] = data;
};

role_adapter.prototype.del_role = function (data) {
    if(this.privilege_dic[data.id]){
        delete this.privilege_dic[data.id];
    }
};


role_adapter.prototype.get_all_role = function () {
    var list = [];
    var _type_list = Object.keys(this.privilege_dic);
    for (var i = 0; i < _type_list.length; i++) {
        var item = this.privilege_dic[_type_list[i]];
        list.push(item);
    }
    return list;
};

role_adapter.prototype.get_role_by_id = function (id) {
    if(this.privilege_dic[id]){
        return this.privilege_dic[id];
    }
    return undefined;
};


module.exports = role_adapter;