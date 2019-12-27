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
    var startTime = new Date().GetMonth().AddMonth(-7);
    var endTime = new Date().GetMonth();

    var response = {
        monthList: [],
        systemList: []
    };

    datadb.stmon.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {system: 1, enUsage: 1, month: 1}, function (err, datas) {
        if(err) logger.error(err);
        if(datas){
            var systemItemDic = {};
            for(var i in datas){
                var item = datas[i];
                if(!systemItemDic[item.month]){
                    systemItemDic[item.month] = {};
                }
                systemItemDic[item.month][item.system] = item.enUsage;
            }

            for(var j in EnergySystem){
                var system = EnergySystem[j];
                response.systemList.push({
                    name: DefinitionHelper.get_system_name(system),
                    data: []
                })
            }

            for(var i in systemItemDic){
                var item = systemItemDic[i];
                response.monthList.push(i);

                var index = 0;
                for(var j in EnergySystem){
                    var system = EnergySystem[j];

                    var sysItem = response.systemList[index];

                    sysItem.data.push(item[system] || 0);
                    index++;
                }
            }

            callback(null, response)
        }
    });
}

module.exports.cmd = cmd.cmd_0x00001012;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};