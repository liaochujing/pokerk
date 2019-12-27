/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var ObjectState = require('../../../definition/object_state');
var db = require('../../../db/index');
var dbPart = db.parts;

function handle(req, res, body, callback) {
    var now = new Date();
    if(body.action == 0) {//删除
        dbPart.update_part_state(body.id, ObjectState.deleted, function (err) {
            if(err) return callback(err);
            callback();
        })
    }else{
        dbPart.update_part_state(body.id, ObjectState.normal, function (err) {
            if(err) return callback(err);
            callback();
        })
    }
}

module.exports.cmd = cmd.ast_0x00000015;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        action: {type: 'number', enum: [0, 1], required: true}
    }
};