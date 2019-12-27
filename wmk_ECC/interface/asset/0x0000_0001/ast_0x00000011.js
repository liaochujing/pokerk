/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var id = body.id;
    var attribute = db.attribute;

    attribute.delete_attribute(id, function (err) {
        if(err) return callback({status: code.unknown});
        callback();
    })
}

module.exports.privilege = PrivilegePoint.removeAsset;
module.exports.cmd = cmd.ast_0x00000011;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true}
    }
};