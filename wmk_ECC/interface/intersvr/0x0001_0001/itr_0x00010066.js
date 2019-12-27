/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var uiclassID = require('../../../definition/uiClassID');
var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db');
var rdbNO = db.ramdb.no;
var rdbNOR = db.ramdb.nor;

var EnSystem = require('../../../modules/energy/definition/energy_system');
var ITSystem = require('../../../modules/energy/definition/it_system');
var deviceHelper = require('../../../helpers/device_helper');

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var buildings = body.buildings;

    if(buildings.length > 0){
        var resDic = {};
        var area_original_data = {};
        var device_original_data = {};

        var get_area_data = function (done) {
            db.datadb.amday.query({$or: buildings, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, day: 1, enUsage: 1, itENUsage: 1/*, ljENUsage: 1, slENUsage: 1, dxENUsage: 1*/, oDryTemp: 1, oWetTemp: 1, oDewTemp: 1}, {time: 1}, function (err, results) {
                if(err) return done(err);

                if(results){
                    for(var i=0;i<results.length;i++){
                        var item = results[i];
                        var _key = format_key(item.serverNO, item.classID, item.id);
                        if(!resDic[_key]){
                            resDic[_key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []};
                            var no = rdbNO.get_by_identity(item);
                            if(no){
                                resDic[_key].ratedPower = no.ratedPower;
                                resDic[_key].ratedITPower = no.ratedITPower;
                            }
                        }
                        resDic[_key].list.push({day: item.day, energy: item.enUsage, oDryTemp: item.oDryTemp, oWetTemp: item.oWetTemp, oDewTemp: item.oDewTemp, '1_1': item.itENUsage/*, '2_1_1': item.ljENUsage, '2_1_2': item.slENUsage, '2_1_3': item.dxENUsage*/});
                    }
                }

                done();
            })
        };

        var get_system_group_data = function (done) {
            db.datadb.sgday.query({$or: buildings, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, system: 1, group: 1, day: 1, enUsage: 1}, {time: 1}, function (err, results) {
                if(err) return done(err);

                if(results){
                    var dic = {};
                    for(var i=0;i<results.length;i++){
                        var item = results[i];
                        var _key = format_key(item.serverNO, item.classID, item.id);
                        if(!dic[_key]){
                            dic[_key] = {};
                        }
                        if(!dic[_key][item.day]){
                            dic[_key][item.day] = [];
                        }
                        dic[_key][item.day].push({system: item.system, group: item.group, energy: item.enUsage});
                    }

                    for(var k in resDic){
                        var buildingItem = resDic[k];
                        var sgDic = dic[k];

                        if(!sgDic){
                            continue;
                        }

                        var itemList = buildingItem.list;
                        for(var i=0;i<itemList.length;i++){
                            var item = itemList[i];

                            if(sgDic[item.day]){
                                var _list = sgDic[item.day];
                                for(var j=0;j<_list.length;j++){
                                    var _sgItem = _list[j];
                                    var key = format_key(_sgItem.system, _sgItem.group);
                                    item[key] = format_value(_sgItem.energy);
                                }
                            }
                        }
                    }
                }

                done();
            })
        };

        var get_original_data = function (done) {
            var _start = startTime;
            var _end = endTime.GetDate().AddDays(1);

            var _list = [];
            while(_start <= _end){
                _list.push(_start);
                _start = _start.AddDays(1);
            }
            var serverNOs = [];
            for(var i=0;i<body.buildings.length;i++){
                var _item = body.buildings[i];
                if(_item.classID == uiclassID.park){
                    var _bs = rdbNOR.get_child_identity(_item.serverNO, _item.classID, _item.id);
                    if(_bs){
                        for(var j=0;j<_bs.length;j++){
                            serverNOs.push(_bs[j].serverNO);
                        }
                    }
                }else{
                    serverNOs.push(_item.serverNO);
                }
            }

            function _get_area_data(cb) {
                ah.each_limit(_list, function (_time, cbItem) {
                    db.datadb.amdata.aggregate([
                        {$match: {time: {$gt: _time.AddMinutes(-10), $lt: _time}, $or: buildings}},
                        {$sort: {time: 1}},
                        {$group: {_id: {serverNO: '$serverNO', classID: '$classID', id: '$id'}, original: {$first: '$original'}}}
                    ],function (err, results) {
                        if(err) return cbItem(err);

                        for(var i=0;i<results.length;i++){
                            var item = results[i];

                            var identity = item._id;
                            var data = undefined;
                            if(item.original){
                                data = item.original.energy;
                            }

                            if(data){
                                if(data.main){
                                    for(var j=0;j<data.main.length;j++){
                                        var _item = data.main[j];
                                        var no = rdbNO.get_by_identity(_item);
                                        _item.name = no ? no.fullName : '未知';
                                    }
                                }
                                if(data.back){
                                    for(var j=0;j<data.back.length;j++){
                                        var _item = data.back[j];
                                        var no = rdbNO.get_by_identity(_item);
                                        _item.name = no ? no.fullName : '未知';
                                    }
                                }
                                if(data.og){
                                    for(var j=0;j<data.og.length;j++){
                                        var _item = data.og[j];
                                        var no = rdbNO.get_by_identity(_item);
                                        _item.name = no ? no.fullName : '未知';
                                    }
                                }
                                if(data.exclude){
                                    for(var j=0;j<data.exclude.length;j++){
                                        var _item = data.exclude[j];
                                        var no = rdbNO.get_by_identity(_item);
                                        _item.name = no ? no.fullName : '未知';
                                    }
                                }
                            }

                            var __key = format_key(identity.serverNO, identity.classID, identity.id);
                            if(!area_original_data[__key]){
                                area_original_data[__key] = []
                            }
                            area_original_data[__key].push({day: _time.format_day(), data: data});
                        }

                        cbItem();
                    })
                }, function () {
                    cb();
                }, 5);
            }

            function _get_cabinet_data(cb) {
                ah.each_limit(_list, function (_time, cbItem) {
                    db.datadb.cmdata.aggregate([
                        {$match: {time: {$gt: _time.AddMinutes(-10), $lt: _time}, serverNO: {$in: serverNOs}}},
                        {$sort: {time: 1}},
                        {$group: {_id: {serverNO: '$serverNO', classID: '$classID', id: '$id'}, energy: {$first: '$energy'}}}
                    ],function (err, results) {
                        if(err) return cbItem(err);

                        var _dic = {};
                        for(var i=0;i<results.length;i++){
                            var item = results[i];
                            var identity = item._id;
                            var energy = item.energy;

                            var esType = {system: EnSystem.it, group: ITSystem.room};
                            var name = undefined;
                            var _cabinet = rdbNO.get_by_identity(identity);
                            if(_cabinet){
                                name = _cabinet.fullName;
                            }

                            if(!_dic[identity.serverNO]){
                                _dic[identity.serverNO] = {};
                            }
                            var _key = format_key(esType.system, esType.group);
                            if(!_dic[identity.serverNO][_key]){
                                _dic[identity.serverNO][_key] = {system: esType.system, group: esType.group, data: []}
                            }
                            _dic[identity.serverNO][_key].data.push({serverNO: identity.serverNO, classID: identity.classID, id: identity.id, name: name || '未知', energy: energy});
                        }

                        for(var j in _dic){
                            var serverItem = _dic[j];

                            var _list = [];
                            for(var key in serverItem){
                                _list.push(serverItem[key]);
                            }

                            if(!device_original_data[j]){
                                device_original_data[j] = []
                            }
                            device_original_data[j].push({day: _time.format_day(), data: _list})
                        }
                        cbItem();
                    })
                }, function () {
                    cb();
                }, 5);
            }

            function _get_device_data(cb) {
                ah.each_limit(_list, function (_time, cbItem) {
                    db.datadb.dmdata.aggregate([
                        {$match: {time: {$gt: _time.AddMinutes(-10), $lt: _time}, serverNO: {$in: serverNOs}}},
                        {$sort: {time: 1}},
                        {$group: {_id: {serverNO: '$serverNO', classID: '$classID', id: '$id'}, energy: {$first: '$energy'}}}
                    ],function (err, results) {
                        if(err) return cbItem(err);

                        var _dic = {};
                        for(var i=0;i<results.length;i++){
                            var item = results[i];
                            var identity = item._id;
                            var energy = item.energy;

                            var esType = undefined;
                            var name = undefined;
                            var no = rdbNO.get_by_identity(identity);
                            if(no){
                                name = no.fullName;
                                var config = deviceHelper.get_device_type_config(no);
                                if(config){
                                    esType = config.esType;
                                }
                            }
                            if(!esType){
                                esType = {system: 0, group: 0};
                            }

                            if(!_dic[identity.serverNO]){
                                _dic[identity.serverNO] = {};
                            }
                            var _key = format_key(esType.system, esType.group);
                            if(!_dic[identity.serverNO][_key]){
                                _dic[identity.serverNO][_key] = {system: esType.system, group: esType.group, data: []}
                            }
                            _dic[identity.serverNO][_key].data.push({serverNO: identity.serverNO, classID: identity.classID, id: identity.id, name: name || '未知', energy: energy});
                        }

                        for(var j in _dic){
                            var serverItem = _dic[j];

                            var _list = [];
                            for(var key in serverItem){
                                _list.push(serverItem[key]);
                            }

                            if(!device_original_data[j]){
                                device_original_data[j] = []
                            }
                            var _day = _time.format_day();
                            var __item = undefined;
                            for(var k=0;k<device_original_data[j].length;k++){
                                var _item = device_original_data[j][k];
                                if(_item.day == _day){
                                    __item = _item;
                                }
                            }
                            if(__item){
                                __item.data = __item.data.concat(_list);
                            }else{
                                device_original_data[j].push({day: _time.format_day(), data: _list})
                            }
                        }
                        cbItem();
                    })
                }, function () {
                    cb();
                }, 5);
            }

            _get_area_data(function () {
                _get_cabinet_data(function () {
                    _get_device_data(done)
                })
            });
        };

        ah.series([get_area_data, get_system_group_data, get_original_data], function (err) {
            if(err){
                callback(err);
                return;
            }

            var response = [];
            for(var i in resDic){
                var buildingItem = resDic[i];
                if(buildingItem.classID == uiclassID.park){
                    var _original = [];
                    for(var k in device_original_data){
                        _original = _original.concat(device_original_data[k]);
                    }
                    buildingItem.original = _original;
                } else {
                    buildingItem.original = device_original_data[buildingItem.serverNO];
                }
                buildingItem.area_original = area_original_data[format_key(buildingItem.serverNO, buildingItem.classID, buildingItem.id)];
                response.push(buildingItem);
            }

            callback(null, response);
        })
    }else{
        callback()
    }
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010066;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        buildings: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true}
                }
            },
            required: true
        },
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};