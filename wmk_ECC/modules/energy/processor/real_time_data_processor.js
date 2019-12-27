/**
 * Created by wangxh on 2017/10/25.
 */

'use strict';

var EnergySystem = require('../definition/energy_system');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var enTHType = require('../../../definition/enth_type');

var serverHelper = require('../../../protocol/central/interface_helper');
var areaHelper = require('../../../helpers/area_helper');
// var systemHelper = require('../system_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

var _device_data = {};
var _area_data = {};
var _system_group_data = {};
var _system_data = {};

const _save_his_interval = 5 * 60 * 1000;
const _cal_per_count = 100;

// var _savePointKey = {};
// var _savePoint = ['power', 'energy', 'in_power', 'out_power', 'in_elec', 'out_elec', 'temp', 'in_water', 'out_water', 'water_flow'];
// for(var i=0;i<_savePoint.length;i++){
//     _savePointKey[_savePoint[i]] = 1;
// }
//不保存的设备类型
var _unSaveClassID = [uiclassID.ENTH, uiclassID.Temp];
var _unSaveDic = {};
for(var i=0;i<_unSaveClassID.length;i++){
    _unSaveDic[_unSaveClassID[i]] = 1;
}
_unSaveClassID = undefined;

function format_object_key() {
    var res = '';
    for(var i in arguments){
        if(res){
            res+='_'
        }
        res+=arguments[i];
    }
    return res
}

function get_device_data_cache(device) {
    if(_device_data[device.serverNO]){
        return _device_data[device.serverNO][device.id];
    }
    return undefined;
}

function get_device_list_data(serverNO, deviceList, cbItem, cbFinal) {
    var _pointList = [];
    if(deviceList && deviceList.length > 0){
        for(var i=0;i<deviceList.length;i++){
            var device = deviceList[i];

            var config = undefined;
            var type = ramdb.dep.get_device_type(device.type);
            if(type && type.config){
                config = type.config;
            }
            if(config && config.mPoints){
                var pointIndexList = [];
                for(var key in config.mPoints){
                    var item = config.mPoints[key];
                    if(item.type != -1){
                        if(item.points && item.points.length > 0){
                            pointIndexList = pointIndexList.concat(item.points);
                        }
                        if(item.exclude && item.exclude.length > 0){
                            pointIndexList = pointIndexList.concat(item.exclude);
                        }
                    }
                }
                if(pointIndexList.length > 0){
                    _pointList.push({id: device.id, points: pointIndexList});
                }
            }
        }
    }

    if(_pointList.length > 0){
        var identitys = {};
        for(var i=0;i<_pointList.length;i++){
            var _item = _pointList[i];
            identitys[_item.id] = _item.points;
        }

        serverHelper.get_point_value(serverNO, identitys, function (err, data) {
            if(err) logger.error({msg: 'cal device data get pv failed', err: err});
            if(data){
                for(var x=0;x<deviceList.length;x++){
                    var device = deviceList[x];
                    if(data[device.id]){
                        var pvDic = data[device.id];

                        var record = {serverNO: device.serverNO, classID: device.classID, id: device.id, time: new Date()};

                        //设备记录所属机房ID
                        var area = ramdb.nor.get_parent_area_identity(device.serverNO, device.classID, device.id);
                        if(area){
                            record.areaID = area.id;
                        }

                        var config = undefined;
                        var type = ramdb.dep.get_device_type(device.type);
                        if(type && type.config){
                            config = type.config;
                        }
                        if(config.mPoints){
                            for(var key in config.mPoints){
                                var _value = 0;
                                var isValid = true;
                                var item = config.mPoints[key];
                                if(item.type != -1){
                                    if(item.points && item.points.length > 0){
                                        for(var i=0;i<item.points.length;i++){
                                            var pv = pvDic[item.points[i]];
                                            if(pv != undefined){
                                                _value+=pv;
                                            }else{
                                                isValid = false;
                                            }
                                        }
                                    }
                                    if(item.exclude && item.exclude.length > 0){
                                        for(var i=0;i<item.exclude.length;i++){
                                            var pv = pvDic[item.exclude[i]];
                                            if(pv != undefined){
                                                _value-=pv;
                                            }else{
                                                isValid = false;
                                            }
                                        }
                                    }
                                    if(isValid){
                                        record[key] = format_value(_value);
                                    }
                                }
                            }
                        }

                        if(!_device_data[device.serverNO]){
                            _device_data[device.serverNO] = {};
                        }
                        _device_data[device.serverNO][device.id] = record;

                        cbItem(record);
                    }
                }
            }

            cbFinal();
        })
    }else{
        cbFinal();
    }
}

function cal_device_data(callback) {
    var deviceList = ramdb.no.get_by_class_rang(uiclassID.device, uiclassID.lastDevice);
    if(deviceList && deviceList.length > 0){
        var _calList = [];

        var _serverNO = deviceList[0].serverNO;
        var _list = [];
        for(var i=0;i<deviceList.length;i++){
            var _item = deviceList[i];

            if(_item.serverNO != _serverNO){
                if(_list.length > 0){
                    _calList.push({serverNO: _serverNO, list: _list});
                    _list = [];
                }
                _serverNO = _item.serverNO;
            }else if(_list.length >= _cal_per_count){
                _calList.push({serverNO: _serverNO, list: _list});
                _list = [];
            }
            _list.push(_item);
        }
        if(_list.length > 0){
            _calList.push({serverNO: _serverNO, list: _list});
        }
        var recordList = [];
        var cabinetList = [];

        ah.each_series(_calList, function (calItem, cbItem) {
            get_device_list_data(calItem.serverNO, calItem.list, function (record) {
                if(_unSaveDic[record.classID]){
                    return;
                }
                if(record.classID == uiclassID.cabinet){
                    cabinetList.push(record);
                    return;
                }
                recordList.push(record);
            }, function () {
                cbItem();
            });
        }, function () {
            var insert_device = function (done) {
                if(recordList.length > 0){
                    datadb.dmdata.insert(recordList, function (err) {
                        if(err) logger.error({msg: 'insert device data failed', err: err});
                        done();
                    });
                }else{
                    done();
                }
            };
            var insert_cabinet = function (done) {
                if(cabinetList.length > 0){
                    datadb.cmdata.insert(cabinetList, function (err) {
                        if(err) logger.error({msg: 'insert cabinet data failed', err: err});
                        done();
                    });
                }else{
                    done();
                }
            };
            insert_device(function () {
                insert_cabinet(function () {
                    callback();
                })
            })
        });
    }else{
        callback();
    }
}


function get_room_data(room, callback) {
    var record = {serverNO: room.serverNO, classID: room.classID, id: room.id, time: new Date()};

    var cTemp = {count: 0, value: 0, max: 0, min: 0};
    var hTemp = {count: 0, value: 0, max: 0, min: 0};
    var cHum = {count: 0, value: 0};
    var hHum = {count: 0, value: 0};

    var enThs = ramdb.nor.get_child_identity_list(room.serverNO, room.classID, room.id, [uiclassID.ENTH, uiclassID.Temp]);
    if(enThs){
        for(var i=0;i<enThs.length;i++){
            var se = ramdb.no.get_by_identity(enThs[i]);
            if(!se){
                continue;
            }

            var seItem = get_device_data_cache(se);
            if(seItem){
                if(se.enTHType == enTHType.cold){
                    if(seItem.temp){
                        cTemp.value+=seItem.temp;
                        cTemp.count++;
                        if(!cTemp.max || seItem.temp > cTemp.max){
                            cTemp.max = seItem.temp;
                        }
                        if(!cTemp.min || seItem.temp < cTemp.min){
                            cTemp.min = seItem.temp;
                        }
                    }
                    if(seItem.hum){
                        cHum.value+=seItem.hum;
                        cHum.count++;
                    }
                }else if(se.enTHType == enTHType.hot){
                    if(seItem.temp){
                        hTemp.value+=seItem.temp;
                        hTemp.count++;
                        if(!hTemp.max || seItem.temp > hTemp.max){
                            hTemp.max = seItem.temp;
                        }
                        if(!hTemp.min || seItem.temp < hTemp.min){
                            hTemp.min = seItem.temp;
                        }
                        if(seItem.hum){
                            hHum.value+=seItem.hum;
                            hHum.count++;
                        }
                    }
                }
            }
        }
    }

    if(cTemp.count > 0){
        record.cTemp = format_value(cTemp.value / cTemp.count);//计算平均值
        record.maxCTemp = cTemp.max;
        record.minCTemp = cTemp.min;
    }
    if(hTemp.count > 0){
        record.hTemp = format_value(hTemp.value / hTemp.count);//计算平均值
        record.maxHTemp = hTemp.max;
        record.minHTemp = hTemp.min;
    }
    if(cHum.count > 0){
        record.cHum = format_value(cHum.value / cHum.count);
    }
    if(hHum.count > 0){
        record.hHum = format_value(hHum.value / hHum.count);
    }

    function get_points(done) {
        var points = room.points;
        if(points){
            var pointList = [];
            for(var key in points){
                var item = points[key];
                if(item.points && item.points.length > 0){
                    pointList = pointList.concat(item.points);
                }
                if(item.exclude && item.exclude.length > 0){
                    pointList = pointList.concat(item.exclude);
                }
            }

            if(pointList.length > 0){
                serverHelper.get_point_value_list(pointList, function (err, data) {
                    if(err) logger.error({msg: 'cal device data get pv failed', err: err});
                    if(data){
                        var pvDic = data[room.serverNO];

                        if(points){
                            for(var key in points){
                                var _value = 0;
                                var isValid = true;
                                var item = points[key];
                                if(item.points && item.points.length > 0){
                                    for(var i=0;i<item.points.length;i++){
                                        var _pItem = item.points[i];
                                        var pv = undefined;
                                        if(pvDic[_pItem.id]){
                                            pv = pvDic[_pItem.id][_pItem.pointIndex];
                                        }
                                        if(pv != undefined){
                                            _value+=pv;
                                        }else{
                                            isValid = false;
                                        }
                                    }
                                }
                                if(item.exclude && item.exclude.length > 0){
                                    for(var i=0;i<item.exclude.length;i++){
                                        var _pItem = item.exclude[i];
                                        var pv = undefined;
                                        if(pvDic[_pItem.id]){
                                            pv = pvDic[_pItem.id][_pItem.pointIndex];
                                        }
                                        if(pv != undefined){
                                            _value-=pv;
                                        }else{
                                            isValid = false;
                                        }
                                    }
                                }
                                if(isValid){
                                    record[key] = format_value(_value);
                                }
                            }
                        }
                    }
                    done();
                })
            }else{
                done();
            }
        }else{
            done();
        }
    }

    get_points(function () {
        // if(record.pw_it && record.power){
        //     record.pue = format_value(record.power / record.pw_it, 3);
        // }

        if(!_area_data[room.serverNO]){
            _area_data[room.serverNO] = {};
        }
        _area_data[room.serverNO][room.id] = record;

        callback(record);
    });
}

function cal_room_data(callback) {
    var roomList = areaHelper.get_data_room();
    if(roomList && roomList.length > 0){
        var recordList = [];
        ah.each_series(roomList, function (room, cbItem) {
            get_room_data(room, function (record) {
                if(record){
                    recordList.push(record);
                }
                cbItem();
            }, true);
        }, function () {
            if(recordList.length > 0){
                datadb.rmdata.insert(recordList, function (err) {
                    if(err) logger.error({msg: 'insert cal room data failed', err: err});
                    callback();
                });
            }else{
                callback();
            }
        })
    }else{
        callback();
    }
}


function get_area_data_cache(area) {
    if(_area_data[area.serverNO]){
        return _area_data[area.serverNO][area.id];
    }
    return undefined;
}


function get_area_data(area, callback){
    var record = {serverNO: area.serverNO, classID: area.classID, id: area.id, original: {}, time: new Date()};

    var get_points = function (done) {
        var points = area.points;
        if(points){
            var pointList = [];
            for(var key in points){
                var item = points[key];
                if(item.points && item.points.length > 0){
                    pointList = pointList.concat(item.points);
                }
                if(item.exclude && item.exclude.length > 0){
                    pointList = pointList.concat(item.exclude);
                }
            }

            if(pointList.length > 0){
                serverHelper.get_point_value_list(pointList, function (err, data) {
                    if(err) logger.error({msg: 'cal area data get pv failed', err: err});
                    if(data){
                        var pvDic = data[area.serverNO];

                        if(points && pvDic){
                            for(var key in points){
                                var _value = 0;
                                var isValid = true;
                                var item = points[key];
                                var original = {points: [], exclude: []};
                                if(item.points && item.points.length > 0){
                                    for(var i=0;i<item.points.length;i++){
                                        var _pItem = item.points[i];
                                        var pv = undefined;
                                        if(pvDic[_pItem.id]){
                                            pv = pvDic[_pItem.id][_pItem.pointIndex];
                                        }
                                        if(pv != undefined){
                                            _value+=pv;
                                        }else{
                                            isValid = false;
                                        }
                                        original.points.push({serverNO: _pItem.serverNO, classID: _pItem.classID, id: _pItem.id, pointIndex: _pItem.pointIndex, value: pv})
                                    }
                                }
                                if(item.exclude && item.exclude.length > 0){
                                    for(var i=0;i<item.exclude.length;i++){
                                        var _pItem = item.exclude[i];
                                        var pv = undefined;
                                        if(pvDic[_pItem.id]){
                                            pv = pvDic[_pItem.id][_pItem.pointIndex];
                                        }
                                        if(pv != undefined){
                                            _value-=pv;
                                        }else{
                                            isValid = false;
                                        }
                                        original.exclude.push({serverNO: _pItem.serverNO, classID: _pItem.classID, id: _pItem.id, pointIndex: _pItem.pointIndex, value: pv})
                                    }
                                }
                                // if(isValid){
                                record[key] = format_value(_value);
                                record.original[key] = original;
                                // }
                            }
                        }
                    }

                    done();
                })
            }else{
                done();
            }
        }else{
            done();
        }
    };

    var get_temp = function (done) {
        var dataRooms = areaHelper.get_data_room(area);

        if(dataRooms && dataRooms.length > 0){
            var cTemp = {count: 0, value: 0, max: 0, min: 0};
            var hTemp = {count: 0, value: 0, max: 0, min: 0};
            var cHum = {count: 0, value: 0};
            var hHum = {count: 0, value: 0};

            for(var i=0;i<dataRooms.length;i++){
                var room = dataRooms[i];
                var roomItem = get_area_data_cache(room);

                if(roomItem){
                    if(roomItem.cTemp){
                        cTemp.value+=roomItem.cTemp;
                        cTemp.count++;
                        if(!cTemp.max || roomItem.maxCTemp > cTemp.max){
                            cTemp.max = roomItem.maxCTemp;
                        }
                        if(!cTemp.min || roomItem.minCTemp < cTemp.min){
                            cTemp.min = roomItem.minCTemp;
                        }
                    }
                    if(roomItem.hTemp){
                        hTemp.value+=roomItem.hTemp;
                        hTemp.count++;
                        if(!hTemp.max || roomItem.maxHTemp > hTemp.max){
                            hTemp.max = roomItem.maxHTemp;
                        }
                        if(!hTemp.min || roomItem.minHTemp < hTemp.min){
                            hTemp.min = roomItem.minHTemp;
                        }
                    }
                    if(roomItem.cHum){
                        cHum.value+=roomItem.cHum;
                        cHum.count++;
                    }
                    if(roomItem.hHum){
                        hHum.value+=roomItem.hHum;
                        hHum.count++;
                    }
                }
            }

            if(cTemp.count > 0){
                record.cTemp = format_value(cTemp.value / cTemp.count);
                record.maxCTemp = cTemp.max;
                record.minCTemp = cTemp.min;
            }
            if(hTemp.count > 0){
                record.hTemp = format_value(hTemp.value / hTemp.count);
                record.maxHTemp = hTemp.max;
                record.minHTemp = hTemp.min;
            }
            if(cHum.count > 0){
                record.cHum = format_value(cHum.value / cHum.count);
            }
            if(hHum.count > 0){
                record.hHum = format_value(hHum.value / hHum.count);
            }
        }

        var ses = areaHelper.get_child_identity_list(area.serverNO, area.classID, area.id, [uiclassID.ENTH, uiclassID.Temp]);
        if(ses && ses.length > 0){
            var oDryTemp = {count: 0, value: 0};
            var oWetTemp = {count: 0, value: 0};
            var oDewTemp = {count: 0, value: 0};
            for(var i=0;i<ses.length;i++){
                var _device = ramdb.no.get_by_identity(ses[i]);
                if(_device){
                    switch(_device.enTHType){
                        case enTHType.out_dry:
                            var data = get_device_data_cache(_device);
                            if(data && data.temp){
                                oDryTemp.value += data.temp;
                                oDryTemp.count++;
                            }
                            break;
                        case enTHType.out_wet:
                            var data = get_device_data_cache(_device);
                            if(data && data.temp){
                                oWetTemp.value += data.temp;
                                oWetTemp.count++;
                            }
                            break;
                        case enTHType.out_dew:
                            var data = get_device_data_cache(_device);
                            if(data && data.temp){
                                oDewTemp.value += data.temp;
                                oDewTemp.count++;
                            }
                            break;
                    }
                }
            }

            if(oDryTemp.count){
                record.oDryTemp = format_value(oDryTemp.value / oDryTemp.count);
            }
            if(oWetTemp.count){
                record.oWetTemp = format_value(oWetTemp.value / oWetTemp.count);
            }
            if(oDewTemp.count){
                record.oDewTemp = format_value(oDewTemp.value / oDewTemp.count);
            }
        }

        done();
    };

    //用电量
    var get_power_use = function (done) {
        var config = area.powerUsePoints;
        if(config){
            var pointList = [];
            if(config.points){
                if(config.points){
                    pointList = pointList.concat(config.points);
                }
                if(config.exclude){
                    pointList = pointList.concat(config.exclude);
                }
            }

            if(pointList.length > 0){
                serverHelper.get_point_value_list(pointList, function (err, data) {
                    if(err) logger.error({msg: 'cal poweruse get pv failed', err: err});

                    if(data && data[area.serverNO]) {
                        var pvDic = data[area.serverNO];
                        var power = 0;

                        if(config.points){
                            for(var i=0;i<config.points.length;i++){
                                var item = config.points[i];
                                if(pvDic[item.id]){
                                    var pv = pvDic[item.id][item.pointIndex];
                                    if(pv != undefined && pv >= 0){
                                        power += pv;
                                    }
                                }
                            }
                        }
                        if(config.exclude){
                            for(var i=0;i<config.exclude.length;i++){
                                var item = config.exclude[i];
                                if(pvDic[item.id]){
                                    var pv = pvDic[item.id][item.pointIndex];
                                    if(pv != undefined && pv >= 0){
                                        power -= pv;
                                    }
                                }
                            }
                        }

                        record.energy = format_value(power);
                        
                        done();
                    }else{
                        done();
                    }
                })
            }else{
                done();
            }
        }
        else{
            done();
        }
    };

    //用水
    var get_water_use = function (done) {
        var config = area.waterUsePoints;
        if(config){
            var pointList = [];
            if(config.points){
                if(config.points){
                    pointList = pointList.concat(config.points);
                }
                if(config.exclude){
                    pointList = pointList.concat(config.exclude);
                }
            }

            if(pointList.length > 0){
                serverHelper.get_point_value_list(pointList, function (err, data) {
                    if(err) logger.error({msg: 'cal wateruse get pv failed', err: err});

                    if(data && data[area.serverNO]) {
                        var pvDic = data[area.serverNO];
                        var power = 0;

                        if(config.points){
                            for(var i=0;i<config.points.length;i++){
                                var item = config.points[i];
                                if(pvDic[item.id]){
                                    var pv = pvDic[item.id][item.pointIndex];
                                    if(pv != undefined && pv >= 0){
                                        power += pv;
                                    }
                                }
                            }
                        }
                        if(config.exclude){
                            for(var i=0;i<config.exclude.length;i++){
                                var item = config.exclude[i];
                                if(pvDic[item.id]){
                                    var pv = pvDic[item.id][item.pointIndex];
                                    if(pv != undefined && pv >= 0){
                                        power -= pv;
                                    }
                                }
                            }
                        }

                        record.water = format_value(power);

                        done();
                    }else{
                        done();
                    }
                })
            }else{
                done();
            }
        }
        else{
            done();
        }
    };

    ah.series([get_points, get_temp, get_power_use, get_water_use], function () {
        if(!_area_data[area.serverNO]){
            _area_data[area.serverNO] = {};
        }
        _area_data[area.serverNO][area.id] = record;
        callback(record);
    });
}

function cal_area_data(callback) {
    var areaList = ramdb.no.get_by_class(uiclassID.area);
    if(areaList && areaList.length > 0){
        var recordList = [];
        ah.each_series(areaList, function (area, cbItem) {
            get_area_data(area, function (record) {
                if(record){
                    var obj = {};
                    for(var key in record){
                        if(key != 'water_flow' && key != 'in_water' && key != 'out_water'){//不记录cop计算值
                            obj[key] = record[key];
                        }
                    }
                    recordList.push(obj);
                }
                cbItem();
            }, true);
        }, function () {
            if(recordList.length > 0){
                datadb.amdata.insert(recordList, function (err) {
                    if(err) logger.error({msg: 'insert cal area data failed', err: err});
                    callback();
                });
            }else{
                callback();
            }
        });
    }else{
        callback();
    }
}


function get_building_data(building, callback) {
    var record = {serverNO: building.serverNO, classID: building.classID, id: building.id, original: {}, time: new Date()};

    var get_points = function (done) {
        var points = building.points;
        if(points){
            var pointList = [];
            for(var key in points){
                var item = points[key];
                if(item.points && item.points.length > 0){
                    pointList = pointList.concat(item.points);
                }
                if(item.exclude && item.exclude.length > 0){
                    pointList = pointList.concat(item.exclude);
                }
            }

            if(pointList.length > 0){
                serverHelper.get_point_value_list(pointList, function (err, data) {
                    if(err) logger.error({msg: 'cal building data get pv failed', err: err});
                    if(data){
                        var pvDic = data[building.serverNO];
                        if(points && pvDic){
                            for(var key in points){
                                var _value = 0;
                                var isValid = true;
                                var item = points[key];
                                var original = {points: [], back: [], og: [], exclude: []};
                                if(item.points && item.points.length > 0){
                                    for(var i=0;i<item.points.length;i++){
                                        var _pItem = item.points[i];
                                        var pv = undefined;
                                        if(pvDic[_pItem.id]){
                                            pv = pvDic[_pItem.id][_pItem.pointIndex];
                                        }
                                        if(pv != undefined){
                                            _value+=pv;
                                        }else{
                                            isValid = false;
                                        }
                                        original.points.push({serverNO: _pItem.serverNO, classID: _pItem.classID, id: _pItem.id, pointIndex: _pItem.pointIndex, value: pv})
                                    }
                                }
                                if(item.exclude && item.exclude.length > 0){
                                    for(var i=0;i<item.exclude.length;i++){
                                        var _pItem = item.exclude[i];
                                        var pv = undefined;
                                        if(pvDic[_pItem.id]){
                                            pv = pvDic[_pItem.id][_pItem.pointIndex];
                                        }
                                        if(pv != undefined){
                                            _value-=pv;
                                        }else{
                                            isValid = false;
                                        }
                                        original.exclude.push({serverNO: _pItem.serverNO, classID: _pItem.classID, id: _pItem.id, pointIndex: _pItem.pointIndex, value: pv})
                                    }
                                }
                                // if(isValid){
                                    record[key] = format_value(_value);
                                    record.original[key] = original;
                                // }
                            }
                        }
                    }

                    done();
                })
            }else{
                done();
            }
        }else{
            done();
        }
    };

    var get_temp = function (done) {
        var dataRooms = areaHelper.get_data_room(building);

        if(dataRooms && dataRooms.length > 0){
            var cTemp = {count: 0, value: 0, max: 0, min: 0};
            var hTemp = {count: 0, value: 0, max: 0, min: 0};
            var cHum = {count: 0, value: 0};
            var hHum = {count: 0, value: 0};

            for(var i=0;i<dataRooms.length;i++){
                var room = dataRooms[i];
                var roomItem = get_area_data_cache(room);

                if(roomItem){
                    if(roomItem.cTemp){
                        cTemp.value+=roomItem.cTemp;
                        cTemp.count++;
                        if(!cTemp.max || roomItem.maxCTemp > cTemp.max){
                            cTemp.max = roomItem.maxCTemp;
                        }
                        if(!cTemp.min || roomItem.minCTemp < cTemp.min){
                            cTemp.min = roomItem.minCTemp;
                        }
                    }
                    if(roomItem.hTemp){
                        hTemp.value+=roomItem.hTemp;
                        hTemp.count++;
                        if(!hTemp.max || roomItem.maxHTemp > hTemp.max){
                            hTemp.max = roomItem.maxHTemp;
                        }
                        if(!hTemp.min || roomItem.minHTemp < hTemp.min){
                            hTemp.min = roomItem.minHTemp;
                        }
                    }
                    if(roomItem.cHum){
                        cHum.value+=roomItem.cHum;
                        cHum.count++;
                    }
                    if(roomItem.hHum){
                        hHum.value+=roomItem.hHum;
                        hHum.count++;
                    }
                }
            }

            if(cTemp.count > 0){
                record.cTemp = format_value(cTemp.value / cTemp.count);
                record.maxCTemp = cTemp.max;
                record.minCTemp = cTemp.min;
            }
            if(hTemp.count > 0){
                record.hTemp = format_value(hTemp.value / hTemp.count);
                record.maxHTemp = hTemp.max;
                record.minHTemp = hTemp.min;
            }
            if(cHum.count > 0){
                record.cHum = format_value(cHum.value / cHum.count);
            }
            if(hHum.count > 0){
                record.hHum = format_value(hHum.value / hHum.count);
            }
        }

        var ses = ramdb.nor.get_child_identity_list(building.serverNO, building.classID, building.id, [uiclassID.ENTH, uiclassID.Temp]);
        if(ses && ses.length > 0){
            var oDryTemp = {count: 0, value: 0};
            var oWetTemp = {count: 0, value: 0};
            var oDewTemp = {count: 0, value: 0};
            for(var i=0;i<ses.length;i++){
                var _device = ramdb.no.get_by_identity(ses[i]);
                if(_device){
                    switch(_device.enTHType){
                        case enTHType.out_dry:
                            var data = get_device_data_cache(_device);
                            if(data && data.temp){
                                oDryTemp.value += data.temp;
                                oDryTemp.count++;
                            }
                            break;
                        case enTHType.out_wet:
                            var data = get_device_data_cache(_device);
                            if(data && data.temp){
                                oWetTemp.value += data.temp;
                                oWetTemp.count++;
                            }
                            break;
                        case enTHType.out_dew:
                            var data = get_device_data_cache(_device);
                            if(data && data.temp){
                                oDewTemp.value += data.temp;
                                oDewTemp.count++;
                            }
                            break;
                    }
                }
            }

            if(oDryTemp.count){
                record.oDryTemp = format_value(oDryTemp.value / oDryTemp.count);
            }
            if(oWetTemp.count){
                record.oWetTemp = format_value(oWetTemp.value / oWetTemp.count);
            }
            if(oDewTemp.count){
                record.oDewTemp = format_value(oDewTemp.value / oDewTemp.count);
            }
        }

        done();
    };

    var get_data = function (done) {
        var total_power = 0;
        var total_energy = 0;
        var total_water = 0;

        var areas = ramdb.nor.get_child_identity_range(building.serverNO, building.classID, building.id, uiclassID.area);
        if(areas){
            for(var i=0;i<areas.length;i++){
                var _buildingData = get_area_data_cache(areas[i]);
                if(_buildingData){
                    if(_buildingData.power){
                        total_power+=_buildingData.power;
                    }
                    if(_buildingData.energy){
                        total_energy+=_buildingData.energy;
                    }
                    if(_buildingData.water){
                        total_water+=_buildingData.water;
                    }
                }
            }
        }

        var power = record.power || total_power;
        var energy = record.energy || total_energy;
        var water = record.water || total_water;

        if(power != undefined){
            record.power = format_value(power);
        }
        if(water != undefined){
            record.water = format_value(water);
        }
        if(energy != undefined){
            record.energy = format_value(energy);
        }

        done();
    };

    ah.series([get_points, get_temp, get_data], function () {
        if(!_area_data[building.serverNO]){
            _area_data[building.serverNO] = {};
        }
        _area_data[building.serverNO][building.id] = record;
        callback(record);
    });
}

function cal_building_data(callback) {
    var buildingList = ramdb.no.get_by_class(uiclassID.building);
    if(buildingList && buildingList.length > 0){
        var recordList = [];
        ah.each_series(buildingList, function (building, cbItem) {
            get_building_data(building, function (record) {
                if(record){
                    var obj = {};
                    for(var key in record){
                        if(key != 'water_flow' && key != 'in_water' && key != 'out_water'){//不记录cop计算值
                            obj[key] = record[key];
                        }
                    }
                    recordList.push(obj);
                }
                cbItem();
            }, true);
        }, function () {
            if(recordList.length > 0){
                datadb.amdata.insert(recordList, function (err) {
                    if(err) logger.error({msg: 'insert cal building data failed', err: err});
                    callback();
                });
            }else{
                callback();
            }
        });
    }else{
        callback();
    }
}


function get_park_data(park, callback) {
    var record = {serverNO: park.serverNO, classID: park.classID, id: park.id, time: new Date()};

    var get_points = function (done) {
        var points = park.points;
        if(points){
            var pointList = [];
            for(var key in points){
                var item = points[key];
                if(item.points && item.points.length > 0){
                    pointList = pointList.concat(item.points);
                }
                if(item.exclude && item.exclude.length > 0){
                    pointList = pointList.concat(item.exclude);
                }
            }

            if(pointList.length > 0){
                serverHelper.get_point_value_list(pointList, function (err, data) {
                    if(err) logger.error({msg: 'cal park data get pv failed', err: err});
                    if(data){
                        if(points){
                            for(var key in points){
                                var _value = 0;
                                var isValid = true;
                                var item = points[key];
                                if(item.points && item.points.length > 0){
                                    for(var i=0;i<item.points.length;i++) {
                                        var _pItem = item.points[i];
                                        var pvDic = data[_pItem.serverNO];
                                        var pv = undefined;
                                        if (pvDic[_pItem.id]) {
                                            pv = pvDic[_pItem.id][_pItem.pointIndex];
                                        }
                                        if (pv != undefined) {
                                            _value += pv;
                                        } else {
                                            isValid = false;
                                        }
                                    }
                                }
                                if(item.exclude && item.exclude.length > 0){
                                    for(var i=0;i<item.exclude.length;i++){
                                        var _pItem = item.exclude[i];
                                        var pvDic = data[_pItem.serverNO];
                                        var pv = undefined;
                                        if(pvDic[_pItem.id]){
                                            pv = pvDic[_pItem.id][_pItem.pointIndex];
                                        }
                                        if(pv != undefined){
                                            _value-=pv;
                                        }else{
                                            isValid = false;
                                        }
                                    }
                                }
                                if(isValid){
                                    record[key] = format_value(_value);
                                }
                            }
                        }
                    }
                    done();
                })
            }else{
                done();
            }
        }else{
            done();
        }
    };

    var get_temp = function (done) {
        var buildings = ramdb.nor.get_child_identity(park.serverNO, park.classID, park.id, uiclassID.building);

        if(buildings && buildings.length > 0){
            var cTemp = {count: 0, value: 0, max: 0, min: 0};
            var hTemp = {count: 0, value: 0, max: 0, min: 0};
            var cHum = {count: 0, value: 0};
            var hHum = {count: 0, value: 0};
            var oDryTemp = {count: 0, value: 0};
            var oWetTemp = {count: 0, value: 0};
            var oDewTemp = {count: 0, value: 0};

            for(var i=0;i<buildings.length;i++){
                var building = buildings[i];
                var buildingItem = get_area_data_cache(building);

                if(buildingItem){
                    if(buildingItem.cTemp){
                        cTemp.value+=buildingItem.cTemp;
                        cTemp.count++;
                        if(!cTemp.max || buildingItem.maxCTemp > cTemp.max){
                            cTemp.max = buildingItem.maxCTemp;
                        }
                        if(!cTemp.min || buildingItem.minCTemp < cTemp.min){
                            cTemp.min = buildingItem.minCTemp;
                        }
                    }
                    if(buildingItem.hTemp){
                        hTemp.value+=buildingItem.hTemp;
                        hTemp.count++;
                        if(!hTemp.max || buildingItem.maxHTemp > hTemp.max){
                            hTemp.max = buildingItem.maxHTemp;
                        }
                        if(!hTemp.min || buildingItem.minHTemp < hTemp.min){
                            hTemp.min = buildingItem.minHTemp;
                        }
                    }
                    if(buildingItem.cHum){
                        cHum.value+=buildingItem.cHum;
                        cHum.count++;
                    }
                    if(buildingItem.hHum){
                        hHum.value+=buildingItem.hHum;
                        hHum.count++;
                    }

                    if(buildingItem.oDryTemp){
                        oDryTemp.value+=buildingItem.oDryTemp;
                        oDryTemp.count++;
                    }
                    if(buildingItem.oWetTemp){
                        oWetTemp.value+=buildingItem.oWetTemp;
                        oWetTemp.count++;
                    }
                    if(buildingItem.oDewTemp){
                        oDewTemp.value+=buildingItem.oDewTemp;
                        oDewTemp.count++;
                    }
                }
            }

            if(cTemp.count > 0){
                record.cTemp = format_value(cTemp.value / cTemp.count);
                record.maxCTemp = cTemp.max;
                record.minCTemp = cTemp.min;
            }
            if(hTemp.count > 0){
                record.hTemp = format_value(hTemp.value / hTemp.count);
                record.maxHTemp = hTemp.max;
                record.minHTemp = hTemp.min;
            }
            if(cHum.count > 0){
                record.cHum = format_value(cHum.value / cHum.count)
            }
            if(hHum.count > 0){
                record.hHum = format_value(hHum.value / hHum.count)
            }
            if(oDryTemp.count > 0){
                record.oDryTemp = format_value(oDryTemp.value / oDryTemp.count)
            }
            if(oWetTemp.count > 0){
                record.oWetTemp = format_value(oWetTemp.value / oWetTemp.count)
            }
            if(oDewTemp.count > 0){
                record.oDewTemp = format_value(oDewTemp.value / oDewTemp.count)
            }
        }

        done();
    };

    var get_data = function (done) {
        var total_power = 0;
        var total_energy = 0;
        var total_water = 0;

        var areas = ramdb.nor.get_child_identity_range(park.serverNO, park.classID, park.id, uiclassID.area);
        if(areas){
            for(var i=0;i<areas.length;i++){
                var _buildingData = get_area_data_cache(areas[i]);
                if(_buildingData){
                    if(_buildingData.power){
                        total_power+=_buildingData.power;
                    }
                    if(_buildingData.energy){
                        total_energy+=_buildingData.energy;
                    }
                    if(_buildingData.water){
                        total_water+=_buildingData.water;
                    }
                }
            }
        }

        var power = record.power || total_power;
        var energy = record.energy || total_energy;
        var water = record.water || total_water;

        if(power != undefined){
            record.power = format_value(power);
        }
        if(water != undefined){
            record.water = format_value(water);
        }
        if(energy != undefined){
            record.energy = format_value(energy);
        }

        done();
    };

    ah.series([get_points, get_temp, get_data], function () {
        if(!_area_data[park.serverNO]){
            _area_data[park.serverNO] = {};
        }
        _area_data[park.serverNO][park.id] = record;
        callback(record);
    });
}

function cal_park_data(callback) {
    var parkList = ramdb.no.get_by_class(uiclassID.park);
    if(parkList && parkList.length > 0){
        var recordList = [];
        ah.each_series(parkList, function (park, cbItem) {
            get_park_data(park, function (record) {
                if(record){
                    var obj = {};
                    for(var key in record){
                        if(key != 'water_flow' && key != 'in_water' && key != 'out_water'){//不记录cop计算值
                            obj[key] = record[key];
                        }
                    }
                    recordList.push(obj);
                }
                cbItem();
            }, true);
        }, function () {
            if(recordList.length > 0){
                datadb.amdata.insert(recordList, function (err) {
                    if(err) logger.error({msg: 'insert cal park data failed', err: err});
                    callback();
                });
            }else{
                callback();
            }
        });
    }else{
        callback();
    }
}



function get_system_group_data_cache(identity, system, group) {
    var key = format_object_key(identity.serverNO, identity.classID, identity.id, system);
    if(_system_group_data[key]){
        return _system_group_data[key][group];
    }else{
        return undefined;
    }
}

function get_system_data_cache(identity, system) {
    var key = format_object_key(identity.serverNO, identity.classID, identity.id, system);
    return _system_data[key];
}

function start_monitor() {
    var cal_data = function () {
        logger.debug('start real time data finished');
        ah.series([cal_device_data, cal_room_data, /*cal_system_group_data, cal_system_data, */cal_area_data, cal_building_data, cal_park_data], function () {
            logger.debug('cal real time data finished');

            logger.info('-- real time data --');
            logger.info('device data: %j', _device_data);
            logger.info('area data: %j', _area_data);
            // logger.info('system group data: %j', _system_group_data);
            // logger.info('system data: %j', _system_data);
        })
    };
    
    setInterval(function () {
        cal_data();
    }, _save_his_interval);

    //30S后计算实时值
    setTimeout(function () {
        cal_data();
    }, 30 * 1000);
}


module.exports.start_monitor = start_monitor;
module.exports.get_device_data_cache = get_device_data_cache;
module.exports.get_area_data_cache = get_area_data_cache;
module.exports.get_system_group_data_cache = get_system_group_data_cache;
module.exports.get_system_data_cache = get_system_data_cache;