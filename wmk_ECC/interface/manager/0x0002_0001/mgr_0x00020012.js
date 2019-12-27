/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');
// var dataHelper = require('../../../protocol/central/server_manager');
// var DataMessage = require('../../../protocol/definition/data_message');
// var CentralCMD = require('../../../protocol/central/cmd');

function handle(req, res, body, callback) {
    callback({status: code.invalid_request});
    // dataHelper.send(new DataMessage(CentralCMD.cen_0x00010011, body), function (err) {
    //     if(err) return callback(err);
    //     callback();
    // })
}

module.exports.cmd = cmd.mgr_0x00020012;
module.exports.privilege = privilegePoint.setLink;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        is_all: {type: 'number', enum: [0, 1], required: true},
        action_links: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: {type: 'integer', required: true},
                    name: {type: 'string', required: true},
                    type: {type: 'integer', required: true},
                    option: {type: 'object', required: true},
                    enabled: {type: 'integer', required: true}
                }
            }
        }
    }
};