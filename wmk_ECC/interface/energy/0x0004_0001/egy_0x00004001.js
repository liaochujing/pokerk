/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var realTimeDataProcessor = require('../../../modules/energy/processor/real_time_data_processor');
var EnergySystem = require('../../../modules/energy/definition/energy_system');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetDate();
    var endTime = new Date();

    var park = ramdb.no.get_by_identity(body);
    if(!park){
        callback({status: code.not_found, msg: 'park not found'});
        return;
    }

    var response = {
        serverNO: park.serverNO,
        classID: park.classID,
        id: park.id,
        name: park.fullName,
        power: 0,
        energy: 0,
        buildings: []
    };

    var buildings = ramdb.nor.get_child_identity(park.serverNO, park.classID, park.id, uiclassID.building);
    if(!buildings || buildings.length <= 0){
        callback(null, response);
        return;
    }
    var identities = [];
    for (var i in buildings) {
        var _item = buildings[i];
        identities.push({serverNO: _item.serverNO, classID: _item.classID, id: _item.id});
    }

    var _areaData = {};
    var get_area_data = function (done) {
        var areas = identities.concat({serverNO: park.serverNO, classID: park.classID, id: park.id});
        datadb.amdata.aggregate([
            {$match: {$or: areas, time: {$gte: startTime, $lt: endTime}}},
            {
                $group: {
                    _id: {
                        serverNO: '$serverNO',
                        classID: '$classID',
                        id: '$id'
                    },
                    start: {$first: '$energy'},
                    end: {$last: '$energy'},
                    power: {$last: '$power'}
                }
            }
        ], function (err, results) {
            if (err) logger.error(err);
            for(var i=0;i<results.length;i++){
                var item = results[i];
                _areaData[format_key(item._id.serverNO, item._id.classID, item._id.id)] = item;
            }

            var power = 0;
            var energy = 0;
            var result = _areaData[format_key(park.serverNO, park.classID, park.id)];
            if(result){
                var _start = result.start || 0;
                var _end = result.end || 0;
                var parkData = realTimeDataProcessor.get_area_data_cache(park);
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
            {$match: {$or: identities, time: {$gte: startTime, $lt: endTime}}},
            {
                $group: {
                    _id: {
                        serverNO: '$serverNO',
                        system: '$system'
                    },
                    start: {$first: '$energy'},
                    end: {$last: '$energy'},
                    power: {$last: '$power'}
                }
            }
        ], function (err, results) {
            if (err) logger.error(err);

            var dic = {};
            if (results) {
                for (var i in results) {
                    var item = results[i];

                    if (!dic[item._id.serverNO]) {
                        dic[item._id.serverNO] = {};
                    }
                    dic[item._id.serverNO][item._id.system] = item;
                }
            }

            var buildings = ramdb.nor.get_child_identity(park.serverNO, park.classID, park.id, uiclassID.building);
            if (buildings) {
                for (var j in buildings) {
                    var building = ramdb.no.get_by_identity(buildings[j]);
                    if (building) {
                        var buildingItem = dic[building.serverNO] || {};
                        var data = realTimeDataProcessor.get_area_data_cache(building) || {};
                        var itdata = realTimeDataProcessor.get_system_data_cache(building, EnergySystem.it);
                        var powerdata = realTimeDataProcessor.get_system_data_cache(building, EnergySystem.power);
                        var colddata = realTimeDataProcessor.get_system_data_cache(building, EnergySystem.cold);
                        var otherdata = realTimeDataProcessor.get_system_data_cache(building, EnergySystem.other);

                        var energy = 0;
                        var power = 0;
                        var pw_it = 0;
                        var en_it = 0;
                        var itItem = buildingItem[EnergySystem.it];
                        if (itdata) {
                            pw_it = itdata.power || 0;
                            en_it = itdata.energy || 0;
                            if (itItem) {
                                en_it -= (itItem.start || 0);
                            }
                        }
                        if (itItem) {
                            if (pw_it <= 0) {
                                pw_it = itItem.power || 0;
                            }
                            if (en_it <= 0) {
                                en_it = (itItem.end || 0) - (itItem.start || 0);
                            }
                        }
                        if (en_it < 0) {
                            en_it = 0;
                        }
                        energy += en_it;
                        power += pw_it;

                        var pw_power = 0;
                        var en_power = 0;
                        var powerItem = buildingItem[EnergySystem.power];
                        if (powerdata) {
                            pw_power = powerdata.power || 0;
                            en_power = powerdata.energy || 0;
                            if (powerItem) {
                                en_power -= (powerItem.start || 0);
                            }
                        }
                        if (powerItem) {
                            if (pw_power <= 0) {
                                pw_power = powerItem.power || 0;
                            }
                            if (en_power <= 0) {
                                en_power = (powerItem.end || 0) - (powerItem.start || 0);
                            }
                        }
                        if (en_power < 0) {
                            en_power = 0;
                        }
                        energy += en_power;
                        power += pw_power;

                        var pw_cold = 0;
                        var en_cold = 0;
                        var coldItem = buildingItem[EnergySystem.cold];
                        if (colddata) {
                            pw_cold = colddata.power || 0;
                            en_cold = colddata.energy || 0;
                            if (coldItem) {
                                en_cold -= (coldItem.start || 0);
                            }
                        }
                        if (coldItem) {
                            if (pw_cold <= 0) {
                                pw_cold = coldItem.power || 0;
                            }
                            if (en_cold <= 0) {
                                en_cold = (coldItem.end || 0) - (coldItem.start || 0);
                            }
                        }
                        if (en_cold < 0) {
                            en_cold = 0;
                        }
                        energy += en_cold;
                        power += pw_cold;

                        var pw_other = 0;
                        var en_other = 0;
                        var otherItem = buildingItem[EnergySystem.other];
                        if (otherdata) {
                            pw_other = otherdata.power || 0;
                            en_other = otherdata.energy || 0;
                            if (otherItem) {
                                en_other -= (otherItem.start || 0);
                            }
                        }
                        if (otherItem) {
                            if (pw_other <= 0) {
                                pw_other = otherItem.power || 0;
                            }
                            if (en_other <= 0) {
                                en_other = (otherItem.end || 0) - (otherItem.start || 0);
                            }
                        }
                        if (en_other < 0) {
                            en_other = 0;
                        }
                        energy += en_other;
                        power += pw_other;

                        var _power = data.power;
                        var _energy = 0;
                        var _buildingData = _areaData[format_key(building.serverNO, building.classID, building.id)];
                        if(_buildingData){
                            var _start = _buildingData.start || 0;
                            var _end = _buildingData.end || 0;
                            if(data.energy){
                                _end = data.energy;
                            }
                            _energy = (_end || 0) - (_start || 0);
                        }

                        if(_power){
                            power = _power;
                        }
                        if(_energy){
                            energy = _energy;
                        }

                        // if (power < 0) {
                        //     power = 0;
                        // }
                        // if (energy < 0) {
                        //     energy = 0;
                        // }

                        response.buildings.push({
                            serverNO: building.serverNO,
                            classID: building.classID,
                            id: building.id,
                            name: building.fullName,

                            power: format_value(power),
                            energy: format_value(energy),
                            oDryTemp: format_value(data.oDryTemp || 0),
                            oWetTemp: format_value(data.oWetTemp || 0),
                            oDewTemp: format_value(data.oDewTemp || 0),
                            cTemp: format_value(data.cTemp || 0),
                            maxCTemp: format_value(data.maxCTemp || 0),
                            minCTemp: format_value(data.minCTemp || 0),

                            pw_it: format_value(pw_it),
                            en_it: format_value(en_it),
                            pw_power: format_value(pw_power),
                            en_power: format_value(en_power),
                            pw_cold: format_value(pw_cold),
                            en_cold: format_value(en_cold),
                            pw_other: format_value(pw_other),
                            en_other: format_value(en_other)
                        })
                    }
                }
            }

            done();
        });
    };

    ah.series([get_area_data, get_system_data], function () {
        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00004001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'integer', required: true},
        classID: {type: 'integer', required: true},
        id: {type: 'integer', required: true}
    }
};