/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);
    db.datadb.sysl.find_sys_log({time: {$gte: startTime, $lt: endTime}}, {_id: 0}, function (err, results) {
        if(err) logger.error(err);
        callback(null, results);
    })
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010034;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};