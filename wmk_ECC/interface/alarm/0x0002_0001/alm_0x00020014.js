/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbAlarmLog = db.datadb.aml;

    dbAlarmLog.find_log({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gt: new Date(body.startTime)}}, {_id: 0, user: 1, action: 1, data: 1, time: 1}, function (err, results) {
        if(err) logger.error({msg: 'get_log', err: err});

        var response = [];
        var rdbOO = db.ramdb.oo;
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var user = rdbOO.get_operator_by_id(item.user);
                response.push({
                    user: user ? user.fullName : '未知',
                    action: item.action,
                    data: item.data,
                    time: item.time
                })
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.alm_0x00020014;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        startTime: {type: 'string', required: true}
    }
};