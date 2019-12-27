/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var cfgKey = require('../../../modules/order/definition/system_config_key');
var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var config = ramdb.cfg.get_system_config(cfgKey.inspection_template);
    callback(null, config)
}

module.exports.privilege = PrivilegePoint.getOrderConfig;
module.exports.cmd = cmd.odr_0x00000028;
module.exports.handle = handle;