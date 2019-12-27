/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db');
var dbNO = db.no;

function handle(req, res, body, callback) {
    var skip = body.skip || 0;
    dbNO.find({fullName: {$regex: body.name}}, {serverNO: 1, classID: 1, id: 1, fullName: 1}).sort({fullName: 1}).skip(skip).limit(30).exec(function (err, results) {
        if(err) return callback(err);
        callback(null, results);
    })
}

module.exports.cmd = cmd.itr_0x00000012;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        name: {type: 'string', required: true},
        skip: {type: 'number'}
    },
    required: true
};