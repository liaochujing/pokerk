/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbCDT = db.cdt;
    dbCDT.find_collect_device_type({}, {_id: 0, id: 1, name: 1, desc: 1}, function (err, result) {
        if(err) return callback(err);
        callback(null, result);
    });
}

module.exports.cmd = cmd.mgr_0x00020009;
module.exports.handle = handle;