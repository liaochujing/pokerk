/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);
    var dbLCL = db.datadb.lcl;

    dbLCL.find_link_control_log({link_id: body.link_id, time: {$gt: startTime, $lt: endTime}}, {_id: 0}, function (err, result) {
        if(err) return callback(err);
        callback(null, result);
    })
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010081;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        link_id: {type: 'integer', required: true},
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};