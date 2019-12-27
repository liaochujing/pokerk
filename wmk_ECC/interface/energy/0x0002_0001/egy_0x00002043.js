/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;

var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var type = body.type;//机柜：1，设备：2

    var startTime = new Date().GetMonth().AddMonth(-12);
    var endTime = new Date().GetMonth();

    var response = {
        monthList: [],
        valueList: []
    };

    var collection = datadb.dmmon;
    if(body.classID == uiclassID.cabinet){
        collection = datadb.cmmon;
    }

    collection.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {month: 1, enUsage: 1}, function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                response.monthList.push(item.month);
                response.valueList.push(item.enUsage || 0);
            }
        }
        
        callback(null, response);

    });
}

module.exports.cmd = cmd.cmd_0x00002043;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        type: {type: 'number', enum: [1, 2], required: true}
    }
};