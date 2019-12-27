/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var sys_cfg_key = require('../../../modules/manager/definition/sys_config_key');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var config = ramdb.cfg.get_system_config(sys_cfg_key.link_control_level);
    callback(null, config)
}

module.exports.cmd = cmd.mgr_0x00010028;
module.exports.handle = handle;