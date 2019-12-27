/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');
var ManagerAction = require('../../../modules/manager/definition/manager_action_type');

var db = require('../../../db');
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    dataHelper.send(new DataMessage(CentralCMD.cen_0x00000011, body), function (err, data) {
        if(err) return callback({status: code.other, msg: err.msg});

        dbOPL.insert_user_log(ManagerAction.email_config, req.user, '修改邮箱配置', req.body, new Date());

        callback(null, data);
    })
}

module.exports.cmd = cmd.mgr_0x00000008;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        host: {type: 'string', required: true},
        port: {type: 'integer', required: true},
        ssl: {type: 'integer', enum: [0, 1], required: true},
        user: {type: 'string', required: true},
        pass: {type: 'string', required: true},
        name: {type: 'string'}
    }
};