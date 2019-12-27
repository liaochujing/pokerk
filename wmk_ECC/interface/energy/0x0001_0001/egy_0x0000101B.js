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
    var room = ramdb.no.get_by_identity(body);
    if(!room){
        callback(null, {});
        return;
    }

    var startTime = new Date().GetMonth().AddMonth(-12);
    var endTime = new Date().GetMonth();

    var response = {
        name: room.fullName,
        monthList: [],
        itValueList: [],
        coldValueList: []
    };

    datadb.rmmon.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {_id: 0, month: 1, itENUsage: 1, coldENUsage: 1}, function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i in results){
                var item = results[i];

                response.monthList.push(item.month);
                response.itValueList.push(format_value(item.itENUsage || 0));
                response.coldValueList.push(format_value(item.coldENUsage || 0));
            }
        }
        
        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x0000101B;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};