/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var logger = require('../../../util/log_manager').logger;
var objectHelper = require('../../../objects/object_helper');

var PrivilegePoint = require('../../../definition/privilege_point');
var PartState = require('../../../modules/asset/definition/part_state');
var db = require('../../../db/index');
var dbPart = db.parts;

function handle(req, res, body, callback) {
    var now = new Date();
    dbPart.update_parts(body.id, body.type, body.name, body.brand, body.model, body.supplier, body.state, body.option, now, function (err) {
        if(err) return callback(err);
        callback();
    })
}

module.exports.cmd = cmd.ast_0x00000014;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        name: {type: 'string'},
        type: {type: 'number'},
        brand: {type: 'string'},
        model: {type: 'string'},
        supplier: {type: 'number'},
        option: {type: 'object'}
    }
};