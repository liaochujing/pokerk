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
    dataHelper.send(new DataMessage(CentralCMD.cen_0x00010008, body), function (err, data) {
        if(err) return callback(err);

        dbOPL.insert_user_log(ManagerAction.update_auth, req.user, '更新授权', null, new Date());

        callback(null, data);
    })
}

module.exports.cmd = cmd.mgr_0x00000007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'integer', required: true},
        classID: {type: 'integer', required: true},
        id: {type: 'integer', required: true},
        file: {type: 'string', required: true}
    }
};