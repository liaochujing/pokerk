/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbALP = db.alp;
    dbALP.find_alarm_type({}, {_id: 0}, function (err, result) {
        if(err) return callback(err);
        callback(null, result);
    });
}

module.exports.privilege = PrivilegePoint.queryAlarmType;
module.exports.cmd = cmd.alm_0x00010005;
module.exports.handle = handle;