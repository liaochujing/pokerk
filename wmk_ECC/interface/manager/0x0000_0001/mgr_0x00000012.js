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
    dataHelper.send(new DataMessage(CentralCMD.cen_0x00000015, body), function (err) {
        if(err) return callback({status: code.other, msg: err.msg});

        dbOPL.insert_user_log(ManagerAction.tel_config, req.user, '修改电话服务配置', req.body, new Date());

        callback();
    })
}

module.exports.cmd = cmd.mgr_0x00000012;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        url: {type: 'string', required: true}
    }
};