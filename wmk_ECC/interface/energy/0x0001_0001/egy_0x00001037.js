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
var OtherSystem = require('../../../modules/energy/definition/other_system');
var DefinitionHelper = require('../../../modules/energy/definition/definition_helper');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetMonth().AddMonth(-12);
    var endTime = new Date().GetMonth();

    var response = {
        monthList: [],
        sgList: []
    };

    datadb.sgmon.aggregate([
        {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, system: EnergySystem.other, time: {$gte: startTime, $lt: endTime}}},
        {$group: {
            _id: {
                month: '$month',
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
                if(!dic[item._id.month]){
                    dic[item._id.month] = {};
                }
                dic[item._id.month][item._id.group] = item.enUsage;
            }
        }

        for(var i in dic){
            response.monthList.push(i);
        }

        for(var i in OtherSystem){
            var group = OtherSystem[i];

            var groupItem = {
                name: DefinitionHelper.get_other_system_name(group),
                data: []
            };
            for(var j in dic){
                var dateItem = dic[j];
                groupItem.data.push(dateItem[group] || 0)
            }

            response.sgList.push(groupItem);
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00001037;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};