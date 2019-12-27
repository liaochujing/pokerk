/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbOT = db.order_template;

function handle(req, res, body, callback) {
    dbOT.find_order_template({}, {_id: 0, id: 1, name: 1, desc: 1}, function (err, results) {
        if(err) return callback(err);
        callback(null, results || []);
    })
}

module.exports.cmd = cmd.odr_0x00000036;
module.exports.handle = handle;