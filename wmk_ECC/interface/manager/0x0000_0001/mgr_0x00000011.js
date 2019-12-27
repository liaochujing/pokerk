/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');

function handle(req, res, body, callback) {
    dataHelper.send(new DataMessage(CentralCMD.cen_0x00000014), function (err, data) {
        if(err) return callback({status: code.other, msg: err.msg});
        callback(null, data);
    })
}

module.exports.cmd = cmd.mgr_0x00000011;
module.exports.handle = handle;