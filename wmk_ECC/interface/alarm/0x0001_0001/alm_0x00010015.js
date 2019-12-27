/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var alarm_aom_processor = require('../../../modules/alarm/processor/alarm_aom_processor');
var sysConfigKey = require('../../../modules/alarm/definition/system_config_key');
var AlarmAction = require('../../../modules/alarm/definition/alarm_action');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var dbCFG = db.cfg;
    dbCFG.update_system_config(svrType, sysConfigKey.alarm_aom_config, body, function (err) {
        if(err) return callback(err);

        db.ramdb.cfg.set_system_config(sysConfigKey.alarm_aom_config, body);
        alarm_aom_processor.update_config(body);
        dbOPL.insert_user_log(AlarmAction.alarm_aom_config, req.user, '修改声光告警配置', req.body, new Date());

        callback();
    })
}

module.exports.cmd = cmd.alm_0x00010015;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        enabled: {type: 'integer', enum: [0, 1], required: true},
        module: {
            type: 'object',
            properties: {
                host: {type: 'string', required: true},
                port: {type: 'integer', required: true},
                address: {type: 'integer', required: true}
            },
            required: true
        },
        alarms: {
            type: 'array',
            items: {type: 'integer'},
            required: true
        },
        interval: {type: 'integer', required: true}
    },
    required: true
};