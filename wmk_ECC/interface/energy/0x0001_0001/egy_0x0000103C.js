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
var PowerSystem = require('../../../modules/energy/definition/power_system');
var DefinitionHelper = require('../../../modules/energy/definition/definition_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var endTime = new Date().GetDate();
    var startTime = new Date().AddDays(-30).GetDate();

    var response = {
        dayList: [],
        sgList: []
    };

    datadb.sgday.aggregate([
        {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, system: EnergySystem.power, time: {$gte: startTime, $lt: endTime}}},
        {$group: {
            _id: {
                day: '$day',
                group: '$group'
            },
            enUsage: {$sum: '$enUsage'}
        }}
    ], function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                if(!dic[item._id.day]){
                    dic[item._id.day] = {};
                }
                dic[item._id.day][item._id.group] = item.enUsage;
            }
        }

        for(var i in dic){
            response.dayList.push(i);
        }

        for(var i in PowerSystem){
            var group = PowerSystem[i];

            var groupItem = {
                name: DefinitionHelper.get_power_system_name(group),
                data: []
            };
            for(var i in dic){
                var dateItem = dic[i];
                groupItem.data.push(dateItem[group] || 0)
            }

            response.sgList.push(groupItem);
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x0000103C;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};