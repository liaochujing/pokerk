/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbParts = db.parts;

function handle(req, res, body, callback) {
    dbParts.findOne({id: body.id}, {_id: 0, _state: 0}, function (err, data) {
        if(err) return callback(err);
        callback(null, data);
    })
}

module.exports.cmd = cmd.ast_0x00000018;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true}
    }
};