/**
 * Created by wangxh on 2017/11/22.
 */
'use strict';

var logger = require('./../../util/log_manager').logger;
var util = require('util');

function table_adapter() {
    var self = this;

    self.tb_name = 'base';
}

table_adapter.prototype.init = function (param, callback) {
    callback();
};

table_adapter.prototype.clear = function (callback) {
    callback();
};

table_adapter.prototype.format_object_key = function (serverNO, classID, id) {
    return '' + serverNO + '_' + classID + '_' + id;
};

module.exports = table_adapter;