/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var name = body.name;
    var attribute = db.attribute;
    var objID = db.objID;

    objID.gen_object_id('attribute', function (err, id) {
        if(err) return callback({status: code.unknown});
        attribute.insert_attribute(id, name, function (err) {
            if(err) return callback({status: code.unknown});
            callback(null, {id: id, name: name});
        })
    });
}

module.exports.privilege = PrivilegePoint.addAsset;
module.exports.cmd = cmd.ast_0x0000000F;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        name: {type: 'string', required: true}
    }
};