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
    var startTime = new Date().GetDate().AddDays(-1);
    var endTime = new Date().GetDate();

    var response = [];

    var project_energy = 0;
    var systemPowerData = {};

    var get_project_power_info = function (done) {
        datadb.amday.aggregate([
            {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}},
            {$group: {
                _id: '',
                enUsage: {$sum: '$enUsage'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results && results.length > 0){
                project_energy = results[0].enUsage;
            }

            done();
        });
    };


    var get_system_power_info = function (done) {
        datadb.stday.aggregate([
            {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}},
            {$group: {
                _id: '$system',
                enUsage: {$sum: '$enUsage'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    systemPowerData[item._id] = item.enUsage;
                }
            }

            done();
        })
    };

    var static_power_info = function (done) {
        response.push({value: project_energy, name: '总能耗'});
        for(var i in EnergySystem){
            var item = EnergySystem[i];

            response.push({
                value: systemPowerData[item] || 0,
                name: DefinitionHelper.get_system_name(item)
            })
        }
        done();
    };

    ah.series([get_project_power_info, get_system_power_info, static_power_info], function () {
        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x0000100D;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};