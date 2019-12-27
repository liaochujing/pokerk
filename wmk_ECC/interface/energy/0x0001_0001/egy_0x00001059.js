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
        cTempList: [],
        maxCTempList: [],
        // minCTempList: [],
        hTempList: [],
        maxHTempList: [],
        // minHTempList: []
    };

    datadb.rmmon.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {_id: 0, id: 1, month: 1, cTemp: 1, maxCTemp: 1/*, minCTemp: 1*/, hTemp: 1, maxHTemp: 1/*, minHTemp: 1*/}, function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i in results){
                var item = results[i];

                response.monthList.push(item.month);
                response.cTempList.push(format_value(item.cTemp || 0));
                response.maxCTempList.push(format_value(item.maxCTemp || 0));
                // response.minCTempList.push(format_value(item.minCTemp || 0));
                response.hTempList.push(format_value(item.hTemp || 0));
                response.maxHTempList.push(format_value(item.maxHTemp || 0));
                // response.minHTempList.push(format_value(item.minHTemp || 0));
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00001059;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};