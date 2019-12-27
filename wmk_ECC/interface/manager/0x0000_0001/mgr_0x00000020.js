/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var cmd = require('../cmd');
var code = require('../code');

var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');

function handle(req, res, body, callback) {
    var msg = new DataMessage(CentralCMD.cen_0x00000003, body);
    dataHelper.send(msg, function (err, data) {
        if(err){
            return callback({status: code.unknown, msg: err.msg});
        }

        callback(null, data);
    });
}

module.exports.cmd = cmd.mgr_0x00000020;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};