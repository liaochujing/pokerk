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
    var user = req.user;
    var config = ramdb.cfg.get_system_config(cfgKey.alarm_timeout_rule);

    callback(null, config)
}

module.exports.privilege = PrivilegePoint.getOrderConfig;
module.exports.cmd = cmd.odr_0x0000000D;
module.exports.handle = handle;