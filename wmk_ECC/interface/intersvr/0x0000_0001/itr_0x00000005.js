/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var dataServerHelper = require('../../../protocol/central/interface_helper');

function handle(req, res, body, callback) {
    dataServerHelper.get_device_point_value(body, function (err,data) {
        if(err){
            return callback({status: code.unknown});
        }
        callback(null, data);
    });
}

module.exports.cmd = cmd.itr_0x00000005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};