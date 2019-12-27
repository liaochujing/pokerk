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
    var dbCFG = db.cfg;
    dbCFG.update_system_config(svrType, sys_cfg_key.link_control_level, body, function (err) {
        if(err) return callback(err);

        ramdb.cfg.set_system_config(sys_cfg_key.link_control_level, body);

        callback();
    })
}

module.exports.cmd = cmd.mgr_0x00010027;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            level: {type: 'number', required: true},
            pm_list: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        key: {type: 'string', required: true}, //0.3或0.5
                        min: {type: 'number', required: true},
                        max: {type: 'number', required: true}
                    }
                },
                required: true
            },
            default_output: {type: 'number', required: true}
        }
    }
};