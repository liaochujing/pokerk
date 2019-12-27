/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;

var realTimeDataProcessor = require('../../../modules/energy/processor/real_time_data_processor');
var EnergySystem = require('../../../modules/energy/definition/energy_system');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {

    var building = ramdb.no.get_by_identity(body);
        if(!building){
        callback(null, {});
        return;
    }

    var startTime = new Date().GetDate();
    var endTime = new Date();
    var response = {
        serverNO: building.serverNO,
        classID: building.classID,
        id: building.id,
        name: building.fullName
    };

    var get_building_data = function (done) {
        datadb.amdata.aggregate([
            {$match: {serverNO: building.serverNO, classID: building.classID, id: building.id, time: {$gte: startTime, $lt: endTime}}},
            {$group: {
                _id: '',
                start: {$first: '$energy'},
                end: {$last: '$energy'},
                power: {$last: '$power'}
            }}
        ], function (err, results) {
            if (err) logger.error(err);
            var power = 0;
            var energy = 0;

            if(results && results.length > 0){
                var result = results[0];
                var _start = result.start || 0;
                var _end = result.end || 0;
                var parkData = realTimeDataProcessor.get_area_data_cache(building);
                if(parkData){
                    power = parkData.power;
                    if(parkData.energy){
                        _end = parkData.energy;
                    }
                }
                if(!power){
                    power = result.power || 0;
                }
                energy = (_end || 0) - (_start || 0);
            }

            response.power = format_value(power);
            response.energy = format_value(energy);

            done();
        });
    };

    var get_system_data = function (done) {
        datadb.stdata.aggregate([
            {$match: {serverNO: building.serverNO, classID: building.classID, id: building.id, time: {$gte: startTime, $lt: endTime}}},
            {$group: {
                _id: '$system',
                start: {$first: '$energy'},
                end: {$last: '$energy'},
                power: {$last: '$power'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            var dic = {};
            if(results){
                for(var i in results){
                    var item = results[i];

                    dic[item._id] = item;
                }
            }

            var data = realTimeDataProcessor.get_area_data_cache(building) || {};
            var itdata = realTimeDataProcessor.get_system_data_cache(building, EnergySystem.it);
            var powerdata = realTimeDataProcessor.get_system_data_cache(building, EnergySystem.power);
            var colddata = realTimeDataProcessor.get_system_data_cache(building, EnergySystem.cold);
            var otherdata = realTimeDataProcessor.get_system_data_cache(building, EnergySystem.other);

            var energy = 0;
            var power = 0;
            var pw_it = 0;
            var en_it = 0;
            var itItem = dic[EnergySystem.it];
            if(itdata){
                pw_it = itdata.power || 0;
                en_it = itdata.energy || 0;
                if(itItem){
                    en_it-=(itItem.start || 0);
                }
            }
            if(itItem){
                if(pw_it <= 0){
                    pw_it = itItem.power || 0;
                }
                if(en_it <= 0){
                    en_it = (itItem.end || 0) - (itItem.start || 0);
                }
            }
            energy+=en_it;
            power+=pw_it;

            var pw_power = 0;
            var en_power = 0;
            var powerItem = dic[EnergySystem.power];
            if(powerdata){
                pw_power = powerdata.power || 0;
                en_power = powerdata.energy || 0;
                if(powerItem){
                    en_power-=(powerItem.start || 0);
                }
            }
            if(powerItem){
                if(pw_power <= 0){
                    pw_power = powerItem.power || 0;
                }
                if(en_power <= 0){
                    en_power = (powerItem.end || 0) - (powerItem.start || 0);
                }
            }
            energy+=en_power;
            power+=pw_power;

            var pw_cold = 0;
            var en_cold = 0;
            var coldItem = dic[EnergySystem.cold];
            if(colddata){
                pw_cold = colddata.power || 0;
                en_cold = colddata.energy || 0;
                if(coldItem){
                    en_cold-=(coldItem.start || 0);
                }
            }
            if(coldItem){
                if(pw_cold <= 0){
                    pw_cold = coldItem.power || 0;
                }
                if(en_cold <= 0){
                    en_cold = (coldItem.end || 0) - (coldItem.start || 0);
                }
            }
            energy+=en_cold;
            power+=pw_cold;

            var pw_other = 0;
            var en_other = 0;
            var otherItem = dic[EnergySystem.other];
            if(otherdata){
                pw_other = otherdata.power || 0;
                en_other = otherdata.energy || 0;
                if(otherItem){
                    en_other-=(otherItem.start || 0);
                }
            }
            if(otherItem){
                if(pw_other <= 0){
                    pw_other = otherItem.power || 0;
                }
                if(en_other <= 0){
                    en_other = (otherItem.end || 0) - (otherItem.start || 0);
                }
            }
            energy+=en_other;
            power+=pw_other;

            if(energy < 0){
                energy = 0;
            }
            if(en_power < 0){
                en_power = 0;
            }
            if(en_it < 0){
                en_it = 0;
            }
            if(en_cold < 0){
                en_cold = 0;
            }
            if(en_other < 0){
                en_other = 0;
            }

            if(!response.power){
                response.power = data.power || format_value(power);
            }
            if(!response.energy){
                response.energy = format_value(energy);
            }
            response.cTemp = data.cTemp || 0;
            response.oDryTemp = data.oDryTemp || 0;
            response.oWetTemp = data.oWetTemp || 0;
            response.oDewTemp = data.oDewTemp || 0;
            response.maxCTemp = data.maxCTemp || 0;
            response.minCTemp = data.minCTemp || 0;
            response.pw_it = format_value(pw_it);
            response.en_it = format_value(en_it);
            response.pw_power = format_value(pw_power);
            response.en_power = format_value(en_power);
            response.pw_cold = format_value(pw_cold);
            response.en_cold = format_value(en_cold);
            response.pw_other = format_value(pw_other);
            response.en_other = format_value(en_other);

            done();
        });
    };

    ah.series([get_building_data, get_system_data], function () {
        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00004011;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};