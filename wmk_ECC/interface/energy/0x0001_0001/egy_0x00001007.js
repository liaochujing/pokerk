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
    var startTime = new Date().AddDays(-1);
    var endTime = new Date();

    var response = [];

    var systemPowerData = {};

    var get_total_power_info = function (done) {
        datadb.amdata.aggregate([
            {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}},
            {$group: {
                _id: '',
                start: {$first: '$energy'},
                end: {$last: '$energy'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results && results.length > 0){
                var result = results[0];
                var value = (result.end || 0) - (result.start || 0);
                response.push({name: '总能耗', value: format_value(value)});
            }else{
                response.push({name: '总能耗', value: 0});
            }

            done();
        })
    };

    var get_system_power_info = function (done) {
        datadb.stdata.aggregate([
            {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}},
            {$group: {
                _id: '$system',
                start: {$first: '$energy'},
                end: {$last: '$energy'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results){
                for(var i=0;i<results.length;i++){
                    var record = results[i];

                    var enUsage = format_value(record.end - record.start);
                    if(enUsage < 0){
                        enUsage = 0;
                    }

                    systemPowerData[record._id] = enUsage;
                }
            }

            done();
        })
    };

    var static_power_info = function (done) {
        for(var i in EnergySystem){
            var item = EnergySystem[i];

            response.push({
                value: systemPowerData[item] || 0,
                name: DefinitionHelper.get_system_name(item)
            })
        }
        done();
    };

    ah.series([get_total_power_info, get_system_power_info, static_power_info], function () {
        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00001007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};