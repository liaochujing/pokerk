/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var building = ramdb.no.get_by_identity(body);
    if(!building){
        callback(null, {});
        return;
    }

    var startTime = new Date().GetDate().AddDays(-7);
    var endTime = new Date().GetDate();
    
    var response = {
        serverNO: building.serverNO,
        classID: building.classID,
        id: building.id,
        name: building.name,
        dayList: [],
        cTempList: [],
        oDryTempList: [],
        oWetTempList: [],
        oDewTempList: []
    };

    datadb.amday.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {_id: 0, day: 1, cTemp: 1, oDryTemp: 1, oWetTemp: 1, oDewTemp: 1}, {time: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i in results){
                var item = results[i];

                response.dayList.push(item.day);
                response.cTempList.push(item.cTemp || 0);
                response.oDryTempList.push(item.oDryTemp || 0);
                response.oWetTempList.push(item.oWetTemp || 0);
                response.oDewTempList.push(item.oDewTemp || 0);
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00004014;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};