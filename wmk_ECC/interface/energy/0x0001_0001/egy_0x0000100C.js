/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');
var areaHelper = require('../../../helpers/area_helper');

var EnergySystem = require('../../../modules/energy/definition/energy_system');
// var ITSystem = require('../../../modules/energy/definition/it_system');
var PowerSystem = require('../../../modules/energy/definition/power_system');
var ColdSystem = require('../../../modules/energy/definition/cold_system');
var OtherSystem = require('../../../modules/energy/definition/other_system');
var DefinitionHelper = require('../../../modules/energy/definition/definition_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetMonth().AddDays(-3);
    var endTime = new Date().GetMonth();

    var building = ramdb.no.get_by_identity(body);
    if(!building){
        callback();
        return;
    }

    var response = {
        name: building.fullName,
        data: []
    };

    var stDataDic = {};
    var sgDataDic = {};
    var roomDataDic = {};
    var cabinetDataDic = {};
    
    var get_system_data = function (done) {
        datadb.stday.aggregate([
            {$match: {serverNO: building.serverNO, classID: body.classID, id: body.id, time: {$lt: endTime, $gte: startTime}}},
            {$group: {
                _id: '$system',
                energy: {$last: '$energy'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    dic[item._id] = item.energy || 0;
                }
            }

            for(var i in EnergySystem){
                var sys = EnergySystem[i];

                var item = dic[sys];
                var cacheItem = realTimeProcessor.get_system_data_cache(building, sys);
                if(item){
                    if(cacheItem && cacheItem.energy){
                        stDataDic[sys] = format_value(cacheItem.energy || 0 - (item.energy || 0));
                    }else{
                        stDataDic[sys] = 0
                    }
                }else{
                    if(cacheItem){
                        stDataDic[sys] = cacheItem.energy || 0;
                    }else{
                        stDataDic[sys] = 0
                    }
                }
            }

            done();
        })
    };

    var get_system_group_data = function (done) {
        datadb.sgday.aggregate([
            {$match: {serverNO: building.serverNO, classID: building.classID, id: building.id, time: {$lt: endTime, $gte: startTime}}},
            {$group: {
                _id: {
                    system: '$system',
                    group: '$group'
                },
                energy: {$last: '$energy'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    if(!dic[item._id.system]){
                        dic[item._id.system] = {};
                    }
                    dic[item._id.system][item._id.group] = item.energy || 0;
                }
            }

            if(!sgDataDic[EnergySystem.cold]){
                sgDataDic[EnergySystem.cold] = {};
            }
            for(var i in ColdSystem){
                var group = ColdSystem[i];
                if(!dic[EnergySystem.cold]){
                    dic[EnergySystem.cold] = {};
                }

                var cacheItem = realTimeProcessor.get_system_group_data_cache(building, EnergySystem.cold, group);

                var start = dic[EnergySystem.cold][group] || 0;
                var end = undefined;
                if(cacheItem){
                    end = cacheItem.energy;
                }

                if(end){
                    sgDataDic[EnergySystem.cold][group] = format_value(end - start);
                }
            }

            if(!sgDataDic[EnergySystem.power]){
                sgDataDic[EnergySystem.power] = {};
            }
            for(var i in PowerSystem){
                var group = PowerSystem[i];
                if(!dic[EnergySystem.power]){
                    dic[EnergySystem.power] = {};
                }

                var cacheItem = realTimeProcessor.get_system_group_data_cache(building, EnergySystem.power, group);

                var start = dic[EnergySystem.power][group] || 0;
                var end = undefined;
                if(cacheItem){
                    end = cacheItem.energy;
                }

                if(end){
                    sgDataDic[EnergySystem.power][group] = format_value(end - start);
                }
            }

            if(!sgDataDic[EnergySystem.other]){
                sgDataDic[EnergySystem.other] = {};
            }
            for(var i in OtherSystem){
                var group = OtherSystem[i];
                if(!dic[EnergySystem.other]){
                    dic[EnergySystem.other] = {};
                }

                var cacheItem = realTimeProcessor.get_system_group_data_cache(building, EnergySystem.other, group);
                var start = dic[EnergySystem.other][group] || 0;
                var end = undefined;
                if(cacheItem){
                    end = cacheItem.energy;
                }

                if(end){
                    sgDataDic[EnergySystem.other][group] = format_value(end - start);
                }
            }

            done();
        })
    };

    var get_room_data = function (done) {
        datadb.rmday.aggregate([
            {$match: {serverNO: building.serverNO, time: {$lt: endTime, $gte: startTime}}},
            {$group: {
                _id: {
                    serverNO: '$serverNO',
                    classID: '$classID',
                    id: '$id'
                },
                energy: {$last: '$energy'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results){
                var dic = {};
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var serverNO = item._id.serverNO;
                    var id = item._id.id;
                    if(!dic[serverNO]){
                        dic[serverNO] = {};
                    }
                    dic[serverNO][id] = item.energy || 0;
                }

                for(var i=0;i<results.length;i++){
                    var room = results[i]._id;

                    var start = 0;
                    if(dic[room.serverNO]){
                        start = dic[room.serverNO][room.id] || 0
                    }
                    var end = undefined;

                    var cacheItem = realTimeProcessor.get_area_data_cache(room);
                    if(cacheItem){
                        end = cacheItem.energy;
                    }

                    if(end){
                        roomDataDic[room.id] = format_value(end - start);
                    }else{
                        roomDataDic[room.id] = 0;
                    }
                }
            }

            done();
        })
    };

    var get_cabinet_data = function (done) {
        datadb.cmday.aggregate([
            {$match: {serverNO: building.serverNO, time: {$lt: endTime, $gte: startTime}}},
            {$group: {
                _id: {
                    serverNO: '$serverNO',
                    classID: '$classID',
                    id: '$id'
                },
                energy: {$last: '$energy'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var serverNO = item._id.serverNO;
                    var id = item._id.id;
                    if(!dic[serverNO]){
                        dic[serverNO] = {}
                    }
                    dic[serverNO][id] = item;
                }

                for(var i=0;i<results.length;i++){
                    var cabinet = results[i]._id;

                    var start = 0;
                    if(dic[cabinet.serverNO]){
                        start = dic[cabinet.serverNO][cabinet.id] || 0;
                    }
                    var end = undefined;

                    var cacheItem = realTimeProcessor.get_device_data_cache(cabinet);
                    if(cacheItem){
                        end = cacheItem.energy;
                    }

                    if(end){
                        cabinetDataDic[cabinet.id] = format_value(end - start);
                    }else{
                        cabinetDataDic[cabinet.id] = 0;
                    }
                }
            }

            done();
        })
    };

    var static_all_info = function (done) {
        var data = response.data;

        var itItem = {
            value: stDataDic[EnergySystem.it] || 0,
            name: DefinitionHelper.get_system_name(EnergySystem.it),
            path: DefinitionHelper.get_system_name(EnergySystem.it),
            children: []
        };

        var roomList = areaHelper.get_data_room(building);
        for(var i in roomList){
            var room = roomList[i];

            var roomPath = itItem.path + '/' + room.fullName;
            var roomItem = {
                value: roomDataDic[room.id] || 0,
                name: room.fullName,
                path: roomPath,
                children: []
            };

            var cabList = areaHelper.get_child_object(room, uiclassID.cabinet);
            for(var j in cabList){
                var cabinet = cabList[j];
                var cabItem = {
                    value: cabinetDataDic[cabinet.id] || 0,
                    name: cabinet.fullName,
                    path: roomPath + '/' + cabinet.fullName
                };
                roomItem.children.push(cabItem);
            }

            itItem.children.push(roomItem);
        }

        data.push(itItem);

        var powerItem = {
            value: stDataDic[EnergySystem.power] || 0,
            name: DefinitionHelper.get_system_name(EnergySystem.power),
            path: DefinitionHelper.get_system_name(EnergySystem.power),
            children: []
        };
        for(var i in PowerSystem){
            var item = PowerSystem[i];

            var sgItem = {
                value: sgDataDic[EnergySystem.power][item] || 0,
                name: DefinitionHelper.get_power_system_name(item),
                path: powerItem.path + '/' + DefinitionHelper.get_power_system_name(item)
            };
            powerItem.children.push(sgItem);
        }
        data.push(powerItem);

        var coldItem = {
            value: stDataDic[EnergySystem.cold] || 0,
            name: DefinitionHelper.get_system_name(EnergySystem.cold),
            path: DefinitionHelper.get_system_name(EnergySystem.cold),
            children: []
        };
        for(var i in ColdSystem){
            var item = ColdSystem[i];

            var sgItem = {
                value: sgDataDic[EnergySystem.cold][item] || 0,
                name: DefinitionHelper.get_cold_system_name(item),
                path: coldItem.path + '/' + DefinitionHelper.get_cold_system_name(item)
            };
            coldItem.children.push(sgItem);
        }
        data.push(coldItem);

        var otherItem = {
            value: stDataDic[EnergySystem.other] || 0,
            name: DefinitionHelper.get_system_name(EnergySystem.other),
            path: DefinitionHelper.get_system_name(EnergySystem.other),
            children: []
        };
        for(var i in OtherSystem){
            var item = OtherSystem[i];

            var sgItem = {
                value: sgDataDic[EnergySystem.other][item] || 0,
                name: DefinitionHelper.get_other_system_name(item),
                path: otherItem.path + '/' + DefinitionHelper.get_other_system_name(item)
            };
            otherItem.children.push(sgItem);
        }
        data.push(otherItem);

        done()
    };

    ah.series([get_system_data, get_system_group_data, get_room_data, get_cabinet_data, static_all_info], function () {
        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x0000100C;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};