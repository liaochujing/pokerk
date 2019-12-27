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
    var response = rdbPST.get_all_parts_type();
    callback(null, response);
}

module.exports.cmd = cmd.ast_0x00000023;
module.exports.handle = handle;