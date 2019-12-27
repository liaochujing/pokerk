/**
 * Created by wangxh on 2018/2/23.
 */

'use strict';

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db');
var ramdb = db.ramdb;

var areaHelper = require('../../../helpers/area_helper');
var deviceHelper = require('../../../helpers/device_helper');
var serverHelper = require('../../../protocol/central/interface_helper');

const _interval = 5 * 60 * 1000;
var _real_time_data = {};

function _set_data(identity, data) {
    if(!_real_time_data[identity.serverNO]){
        _real_time_data[identity.serverNO] = {};
    }
    if(!_real_time_data[identity.serverNO][identity.classID]){
        _real_time_data[identity.serverNO][identity.classID] = {};
    }
    _real_time_data[identity.serverNO][identity.classID][identity.id] = data;
}

function _get_data(identity) {
    if(_real_time_data[identity.serverNO] && _real_time_data[identity.serverNO][identity.classID]){
        return _real_time_data[identity.serverNO][identity.classID][identity.id]
    }else{
        return undefined;
    }
}

function get_data_by_identity(identity) {
    return _get_data(identity);
}

function cal_room_data(done) {
    var rooms = areaHelper.get_data_room();
    ah.each_series(rooms, function (room, cbItem) {
        var cabinets = ramdb.nor.get_child_identity_range(room.serverNO, room.classID, room.id, uiclassID.cabinet);
        if(cabinets && cabinets.length > 0){
            var pw_it = 0;
            for(var i=0;i<cabinets.length;i++){
                var cabItem = _get_data(cabinets[i]);
                if(cabItem){
                    pw_it += cabItem.power;
                }
            }

            if(pw_it >= 0){
                var cold = 0;
                if(room.cpRatio != undefined){
                    cold = room.cpRatio * pw_it;
                }
                _set_data(room, {pw_it: format_value(pw_it), cold: format_value(cold)})
            }
        }
        cbItem();
    }, function () {
        done();
    });
}

function cal_building_data(done) {
    var buildings = ramdb.no.get_by_class(uiclassID.building);
    ah.each_series(buildings, function (building, cbItem) {
        var buildingData = {
            entry: [],
            pw_it: 0,
            cold: 0,
            ucold: 0
        };
        var ucCount = 0;
        var get_entry_data = function (callback) {
            if(building.entry){
                var points = [];
                for(var i=0;i<building.entry.length;i++){
                    var entry = building.entry[i];
                    if(entry.power_a){
                        if(entry.power_a.points){
                            points = points.concat(entry.power_a.points)
                        }
                        if(entry.power_a.exclude){
                            points = points.concat(entry.power_a.exclude)
                        }
                    }
                    if(entry.power_b){
                        if(entry.power_b.points){
                            points = points.concat(entry.power_b.points)
                        }
                        if(entry.power_b.exclude){
                            points = points.concat(entry.power_b.exclude)
                        }
                    }
                    if(entry.power_c){
                        if(entry.power_c.points){
                            points = points.concat(entry.power_c.points)
                        }
                        if(entry.power_c.exclude){
                            points = points.concat(entry.power_c.exclude)
                        }
                    }

                    if(entry.out_power_a){
                        if(entry.out_power_a.points){
                            points = points.concat(entry.out_power_a.points)
                        }
                        if(entry.out_power_a.exclude){
                            points = points.concat(entry.out_power_a.exclude)
                        }
                    }
                    if(entry.out_power_b){
                        if(entry.out_power_b.points){
                            points = points.concat(entry.out_power_b.points)
                        }
                        if(entry.out_power_b.exclude){
                            points = points.concat(entry.out_power_b.exclude)
                        }
                    }
                    if(entry.out_power_c){
                        if(entry.out_power_c.points){
                            points = points.concat(entry.out_power_c.points)
                        }
                        if(entry.out_power_c.exclude){
                            points = points.concat(entry.out_power_c.exclude)
                        }
                    }
                }
                if(building.ucPoint){//制冷单元数量点
                    points.push(building.ucPoint);
                }
                if(points.length > 0){
                    serverHelper.get_point_value_list(points, function (err, data) {
                        if(err) logger.error(err);

                        if(data){
                            for(var i=0;i<building.entry.length;i++){
                                var entry = building.entry[i];
                                var power_a = 0;
                                if(entry.power_a){
                                    var _power = 0;
                                    var _isValid = true;
                                    if(entry.power_a.points){
                                        for(var j=0;j<entry.power_a.points.length;j++){
                                            var _point = entry.power_a.points[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power+=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(entry.power_a.exclude){
                                        for(var j=0;j<entry.power_a.exclude.length;j++){
                                            var _point = entry.power_a.exclude[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power-=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(_isValid){
                                        power_a = _power;
                                    }
                                }
                                var power_b = 0;
                                if(entry.power_b){
                                    var _power = 0;
                                    var _isValid = true;
                                    if(entry.power_b.points){
                                        for(var j=0;j<entry.power_b.points.length;j++){
                                            var _point = entry.power_b.points[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power+=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(entry.power_b.exclude){
                                        for(var j=0;j<entry.power_b.exclude.length;j++){
                                            var _point = entry.power_b.exclude[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power-=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(_isValid){
                                        power_b = _power;
                                    }
                                }
                                var power_c = 0;
                                if(entry.power_c){
                                    var _power = 0;
                                    var _isValid = true;
                                    if(entry.power_c.points){
                                        for(var j=0;j<entry.power_c.points.length;j++){
                                            var _point = entry.power_c.points[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power+=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(entry.power_c.exclude){
                                        for(var j=0;j<entry.power_c.exclude.length;j++){
                                            var _point = entry.power_c.exclude[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power-=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(_isValid){
                                        power_c = _power;
                                    }
                                }

                                var out_power_a = 0;
                                if(entry.out_power_a){
                                    var _power = 0;
                                    var _isValid = true;
                                    if(entry.out_power_a.points){
                                        for(var j=0;j<entry.out_power_a.points.length;j++){
                                            var _point = entry.out_power_a.points[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power+=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(entry.out_power_a.exclude){
                                        for(var j=0;j<entry.out_power_a.exclude.length;j++){
                                            var _point = entry.out_power_a.exclude[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power-=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(_isValid){
                                        out_power_a = _power;
                                    }
                                }
                                var out_power_b = 0;
                                if(entry.out_power_b){
                                    var _power = 0;
                                    var _isValid = true;
                                    if(entry.out_power_b.points){
                                        for(var j=0;j<entry.out_power_b.points.length;j++){
                                            var _point = entry.out_power_b.points[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power+=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(entry.out_power_b.exclude){
                                        for(var j=0;j<entry.out_power_b.exclude.length;j++){
                                            var _point = entry.out_power_b.exclude[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power-=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(_isValid){
                                        out_power_b = _power;
                                    }
                                }
                                var out_power_c = 0;
                                if(entry.out_power_c){
                                    var _power = 0;
                                    var _isValid = true;
                                    if(entry.out_power_c.points){
                                        for(var j=0;j<entry.out_power_c.points.length;j++){
                                            var _point = entry.out_power_c.points[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power+=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(entry.out_power_c.exclude){
                                        for(var j=0;j<entry.out_power_c.exclude.length;j++){
                                            var _point = entry.out_power_c.exclude[j];
                                            var pv = undefined;
                                            if(data[_point.serverNO] && data[_point.serverNO][_point.id]){
                                                pv = data[_point.serverNO][_point.id][_point.pointIndex];
                                            }
                                            if(pv != undefined){
                                                _power-=pv;
                                            }else{
                                                _isValid = false;
                                            }
                                        }
                                    }
                                    if(_isValid){
                                        out_power_c = _power;
                                    }
                                }

                                var power = power_a + power_b + power_c;
                                var out_power = out_power_a + out_power_b + out_power_c;

                                buildingData.entry.push({power: format_value(power), out_power: format_value(out_power)});
                            }

                            if(building.ucPoint){
                                var _ucPoint = building.ucPoint;
                                if(data[_ucPoint.serverNO] && data[_ucPoint.serverNO][_ucPoint.id]){
                                    ucCount = data[_ucPoint.serverNO][_ucPoint.id][_ucPoint.pointIndex] || 0;
                                }
                            }
                        }

                        callback();
                    })
                }else{
                    callback();
                }
            }else{
                callback();
            }
        };

        get_entry_data(function () {
            var pw_it = 0;
            var cabinets = ramdb.no.get_by_class(uiclassID.cabinet, building.serverNO);
            if(cabinets && cabinets.length > 0){
                for(var i=0;i<cabinets.length;i++){
                    var cabinetData = _get_data(cabinets[i]);
                    if(cabinetData){
                        pw_it+=cabinetData.power
                    }
                }
            }
            buildingData.pw_it = format_value(pw_it);

            if(pw_it >= 0 && building.cpRatio != undefined){
                buildingData.cold = format_value(building.cpRatio * pw_it);

                if(building.unitColdPower != undefined && ucCount){
                    buildingData.ucCount = ucCount;
                    buildingData.ucold = format_value(building.cpRatio * pw_it / ucCount);
                }
            }

            _set_data(building, buildingData);

            cbItem();
        });
    }, function () {
        done();
    });
}

function start_monitor() {
    function cal_data() {
        ah.series([cal_room_data, cal_building_data], function (err) {
            if(err) logger.error({msg: 'cal capacity data failed', err: err});
            //记录实时数据
            logger.info('-- real time data --');
            logger.info(JSON.stringify(_real_time_data))
        });
    }

    setInterval(function () {
        cal_data();
    }, _interval);

    setTimeout(function () {
        cal_data();
    }, 30 * 1000);
}

module.exports.start_monitor = start_monitor;
module.exports.get_data_by_identity = get_data_by_identity;