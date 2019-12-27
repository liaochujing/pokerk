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
var DefinitionHelper = require('../../../modules/energy/definition/definition_helper');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = {
        dayList: [],
        systemList: []
    };

    var startTime = new Date().GetDate().AddYear(-30);
    var endTime = new Date().GetDate();

    datadb.stday.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {system: 1, day: 1, enUsage: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                if(!dic[item.day]){
                    dic[item.day] = {};
                }
                dic[item.day][item.system] = item.enUsage;
            }
        }

        for(var i in dic){
            response.dayList.push(i);
        }

        for(var i in EnergySystem){
            var system = EnergySystem[i];

            var systemItem = {
                system: system,
                name: DefinitionHelper.get_system_name(system),
                dataList: []
            };

            for(var k in dic){
                var dayItem = dic[k];
                systemItem.dataList.push(dayItem[system] || 0)
            }

            response.systemList.push(systemItem);
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x0000301B;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};