/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbPST = db.pst;
var rdbPST = db.ramdb.pst;

function handle(req, res, body, callback) {
    dbPST.remove_parts_type(body.id, function (err) {
        if(err) return callback(err);

        rdbPST.del_type(body.id);

        callback();
    })
}

module.exports.cmd = cmd.ast_0x00000022;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true}
    }
};