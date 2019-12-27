/**
 * Created by wangxh on 2017/11/16.
 */

'use strict';

/**
 * Created by wangxh on 2017/9/27.
 */

'use strict';


var util = require('util');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('./../../../definition/uiClassID');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');

var privilege = require('../../index').privilege;

function privilege_adapter() {
    var self = this;

    self.tb_name = 'privilege';

    self.plg_dic = {};
}

util.inherits(privilege_adapter, table_adapter);

privilege_adapter.prototype.init = function (param, callback) {
    var self = this;

    privilege.find_privilege({}, {}, function (err, result) {
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];

                self.plg_dic[item.id] = {
                    id: item.id,
                    name: item.name,
                    desc: item.desc,
                    points: item.points
                }
            }
        }

        callback();
    });
};

privilege_adapter.prototype.get_privilege_list = function () {
    var res = [];

    for(var i in this.plg_dic){
        var item = this.plg_dic[i];
        res.push(item);
    }

    return res;
};

module.exports = privilege_adapter;