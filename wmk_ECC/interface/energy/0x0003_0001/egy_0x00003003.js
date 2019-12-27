/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var system = body.system;

    var response = {
        timeList: [],
        dataList: []
    };

    var startTime = new Date().GetMonth().AddMonth(-13);
    var endTime = new Date().GetMonth();

    datadb.stmon.query({serverNO: body.serverNO, classID: body.classID, id: body.id, system: system, time: {$gte: startTime, $lt: endTime}}, {month: 1, enUsage: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                dic[item.month] = item.enUsage;
            }
        }

        var time = startTime;
        for(var i=0;i<13;i++){
            time = startTime.AddMonth(i);

            var month = time.format_month();
            response.timeList.push(month);
            response.dataList.push(dic[month] || 0);
        }

        callback(null, response);
    });

}

module.exports.cmd = cmd.cmd_0x00003003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        system: {type: 'number', required: true}
    }
};