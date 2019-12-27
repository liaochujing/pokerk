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

    // dataHelper.send(new DataMessage(CentralCMD.cen_0x00010012, body), function (err, data) {
    //     if(err) return callback(err);
    //     callback(null, data.action_links);
    // })
}

module.exports.cmd = cmd.mgr_0x00020013;
module.exports.privilege = privilegePoint.queryLink;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        link_id: {type: 'number'}
    }
};