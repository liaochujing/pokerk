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
    var name = body.name;
    var attribute = db.attribute;

    attribute.update_attribute(id, name, function (err) {
        if(err) return callback({status: code.unknown});
        callback();
    })
}

module.exports.privilege = PrivilegePoint.modifyAsset;
module.exports.cmd = cmd.ast_0x00000010;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        name: {type: 'string', required: true}
    }
};
