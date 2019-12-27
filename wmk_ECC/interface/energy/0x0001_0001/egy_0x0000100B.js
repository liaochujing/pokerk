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
    var startTime = new Date().GetDate().AddDays(-1);
    var endTime = new Date().GetDate();

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
                enUsage: {$last: '$enUsage'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    stDataDic[item._id] = item.enUsage;
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
                enUsage: {$last: '$enUsage'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    if(!sgDataDic[item._id.system]){
                        sgDataDic[item._id.system] = {};
                    }
                    sgDataDic[item._id.system][item._id.group] = item.enUsage;
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
                enUsage: {$last: '$enUsage'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var serverNO = item._id.serverNO;
                    var id = item._id.id;
                    if(!roomDataDic[serverNO]){
                        roomDataDic[serverNO] = {};
                    }
                    roomDataDic[serverNO][id] = item.enUsage || 0;
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
                enUsage: {$last: '$enUsage'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var serverNO = item._id.serverNO;
                    var id = item._id.id;

                    if(!cabinetDataDic[serverNO]){
                        cabinetDataDic[serverNO] = {}
                    }
                    cabinetDataDic[serverNO][id] = item.enUsage;
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

            var value = 0;
            if(roomDataDic[room.serverNO]){
                value = roomDataDic[room.serverNO][room.id]
            }

            var roomPath = itItem.path + '/' + room.fullName;
            var roomItem = {
                value: value || 0,
                name: room.fullName,
                path: roomPath,
                children: []
            };

            var cabList = areaHelper.get_child_object(room, uiclassID.cabinet);
            for(var j in cabList){
                var cabinet = cabList[j];
                var value = 0;
                if(cabinetDataDic[cabinet.serverNO]){
                    value = cabinetDataDic[cabinet.serverNO][cabinet.id]
                }
                var cabItem = {
                    value: value || 0,
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
        var sgItem = sgDataDic[EnergySystem.power] || {};
        for(var i in PowerSystem){
            var item = PowerSystem[i];

            var _sgItem = {
                value: sgItem[item] || 0,
                name: DefinitionHelper.get_power_system_name(item),
                path: powerItem.path + '/' + DefinitionHelper.get_power_system_name(item)
            };
            powerItem.children.push(_sgItem);
        }
        data.push(powerItem);

        var coldItem = {
            value: stDataDic[EnergySystem.cold] || 0,
            name: DefinitionHelper.get_system_name(EnergySystem.cold),
            path: DefinitionHelper.get_system_name(EnergySystem.cold),
            children: []
        };
        var sgItem = sgDataDic[EnergySystem.cold] || {};
        for(var i in ColdSystem){
            var item = ColdSystem[i];

            var _sgItem = {
                value: sgItem[item] || 0,
                name: DefinitionHelper.get_cold_system_name(item),
                path: coldItem.path + '/' + DefinitionHelper.get_cold_system_name(item)
            };
            coldItem.children.push(_sgItem);
        }
        data.push(coldItem);

        var otherItem = {
            value: stDataDic[EnergySystem.other] || 0,
            name: DefinitionHelper.get_system_name(EnergySystem.other),
            path: DefinitionHelper.get_system_name(EnergySystem.other),
            children: []
        };
        var sgItem = sgDataDic[EnergySystem.other] || {};
        for(var i in OtherSystem){
            var item = OtherSystem[i];

            var _sgItem = {
                value: sgItem[item] || 0,
                name: DefinitionHelper.get_other_system_name(item),
                path: otherItem.path + '/' + DefinitionHelper.get_other_system_name(item)
            };
            otherItem.children.push(_sgItem);
        }
        data.push(otherItem);

        done()
    };

    ah.series([get_system_data, get_system_group_data, get_room_data, get_cabinet_data, static_all_info], function () {
        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x0000100B;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};