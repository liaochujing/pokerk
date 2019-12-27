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

    var key = cfgKey.alarm_order_rule;
    var value = body;

    var dbCFG = db.cfg;

    if(value.list){
        for(var i=0;i<value.list.length;i++){
            var item = value.list[i];
            if(item.alarmClassID && item.alarmClassID.length == 0){
                delete item.alarmClassID;
            }
            if(item.deviceClassID && item.deviceClassID.length == 0){
                delete item.deviceClassID;
            }
        }
    }
    dbCFG.update_system_config(svrType, key, value, function (err) {
        if(err) return callback(err);

        ramdb.cfg.set_system_config(key, value);
        dbOPL.insert_user_log(OrderAction.alarm_order_rule, user, '修改告警派单规则', value, new Date());

        callback();
    })
}

module.exports.privilege = PrivilegePoint.setOrderConfig;
module.exports.cmd = cmd.odr_0x00000008;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
            required: true
        },
        list: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    region: {
                        type: 'object',
                        properties: {
                            serverNO: {type: 'number', required: true},
                            classID: {type: 'number', required: true},
                            id: {type: 'number', required: true}
                        }
                    },
                    deviceClassID: {type: 'array', items: {type: 'number'}},
                    alarmClassID: {type: 'array', items: {type: 'number'}},
                    alarmLevel: {type: 'number'},
                    sponsor: {type: 'number', required: true},
                    group: {type: 'number', required: true}
                }
            },
            required: true
        }
    }
};