/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);
    var rdbOO = db.ramdb.oo;

    db.datadb.minsp.find_inspection({time: {$gte: startTime, $lt: endTime}}, {_id: 1, user: 1, time: 1}, function (err, results) {
        if(err) return callback(err);

        var response = [];
        if(results){
            for(var i=0;i<results.length;i++){
                var row = results[i];
                var user = rdbOO.get_operator_by_id(row.user);
                var userName = undefined;
                if(user){
                    userName = user.fullName;
                }
                response.push({
                    id: row._id,
                    user: userName,
                    time: row.time
                })
            }
        }

        callback(null, response);
    });
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010080;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};