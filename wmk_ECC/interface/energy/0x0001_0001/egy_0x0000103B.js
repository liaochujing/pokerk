/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;

var EnergySystem = require('../../../modules/energy/definition/energy_system');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var endTime = new Date().GetDate();
    var startTime = new Date().AddDays(-30).GetDate();

    var response = [];

    datadb.stday.query({serverNO: body.serverNO, classID: body.classID, id: body.id, system: EnergySystem.power, time: {$gte: startTime, $lt: endTime}}, {day: 1, enUsage: 1}, function (err, results) {
        if(err) logger.error(err);
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                response.push({day: item.day, value: item.enUsage});
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x0000103B;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};