/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbLC = db.lc;
    dbLC.find_link_control({}, {_id: 0}, function (err, result) {
        if(err) return callback(err);
        callback(null, result);
    })
}

module.exports.cmd = cmd.mgr_0x00010026;
module.exports.handle = handle;