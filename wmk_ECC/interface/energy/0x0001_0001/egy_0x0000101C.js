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

    var startTime = new Date().GetDate().AddDays(-30);
    var endTime = new Date().GetDate();

    var response = {
        name: room.fullName,
        dayList: [],
        valueList: []
    };

    datadb.rmday.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {_id: 0, day: 1, power: 1}, function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i in results){
                var item = results[i];

                response.dayList.push(item.day);
                response.valueList.push(item.power);
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x0000101C;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};