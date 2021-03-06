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
var ColdSystem = require('../../../modules/energy/definition/cold_system');
var DefinitionHelper = require('../../../modules/energy/definition/definition_helper');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetDate().AddDays(-30);
    var endTime = new Date().GetDate();

    var response = {
        dayList: [],
        groupList: []
    };

    datadb.sgday.query({serverNO: body.serverNO, classID: body.classID, id: body.id, system: EnergySystem.cold, time: {$gte: startTime, $lt: endTime}}, {group: 1, day: 1, enUsage: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                if(!dic[item.day]){
                    dic[item.day] = {};
                }
                dic[item.day][item.group] = item.enUsage;
            }
        }

        for(var day in dic){
            response.dayList.push(day)
        }

        for(var i in ColdSystem){
            var group = ColdSystem[i];

            var groupItem = {
                name: DefinitionHelper.get_cold_system_name(group),
                valueList: []
            };

            for(var day in dic){
                var dayItem = dic[day];
                groupItem.valueList.push(dayItem[group] || 0)
            }

            response.groupList.push(groupItem);
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00001025;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};