/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var cfgKey = require('../../../modules/order/definition/system_config_key');
var OrderAction = require('../../../modules/order/definition/order_action_type');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var user = req.user;

    var key = cfgKey.maintain;
    var value = body;

    var dbCFG = db.cfg;
    dbCFG.update_system_config(svrType, key, value, function (err) {
        if(err) return callback(err);

        ramdb.cfg.set_system_config(key, value);
        dbOPL.insert_user_log(OrderAction.maintain_order_config, user, '修改维护工单通知规则', value, new Date());

        callback();
    })
}

module.exports.privilege = PrivilegePoint.setOrderConfig;
module.exports.cmd = cmd.odr_0x0000000E;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        receiveTimeout: {type: 'number', required: true},
        aheadPlanDay: {type: 'number', required: true},
        option: {
            type: 'object',
            properties: {
                format: {type: 'string', required: true},
                mode: {type: 'array', items: {type: 'number'}, required: true}
            },
            required: true
        }
    }
};