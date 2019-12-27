/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');
var dataHelper = require('../../../protocol/central/server_manager');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');

function handle(req, res, body, callback) {
    dataHelper.send(new DataMessage(CentralCMD.cen_0x00010013, body), function (err) {
        if(err) return callback(err);
        callback();
    })
}

function get_privilege_point(body, done) {
    var type = undefined;
    if(body.option){
        type = body.option.type;
    }
    switch(type){
        case 1://控制点(组)
            done(null, privilegePoint.controlPoint);
            break;
        default:
            done({status: code.other, msg: 'unknown action'});
            break;
    }
}

module.exports.cmd = cmd.mgr_0x00020014;
module.exports.get_privilege_point = get_privilege_point;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        option: {
            type: 'object',
            properties: {
                type: {type: 'integer', required: true}
            },
            required: true
        }
    }
};