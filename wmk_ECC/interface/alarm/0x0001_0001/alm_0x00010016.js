/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var db = require('../../../db');

function handle(req, res, body, callback) {
    var config = db.ramdb.cfg.get_system_config(sysConfigKey.alarm_aom_config);
    callback(null, config);
}

module.exports.cmd = cmd.alm_0x00010016;
module.exports.handle = handle;