/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');
var ramdb = db.ramdb;

var areaHelper = require('../../../helpers/area_helper');
var serverHelper = require('../../../protocol/central/interface_helper');
var realTimeProcessor = require('../../../modules/capacity/processor/real_time_data_processor');

function handle(req, res, body, callback) {
    var identity = body;
    var building = ramdb.no.get_by_identity(identity);
    if(building){
        var _buildingUsedCabinets = 0;
        var cabinets = ramdb.no.get_by_class(uiclassID.cabinet, building.serverNO);
        if(cabinets){
            for(var j=0;j<cabinets.length;j++){
                var cabinet = cabinets[j];
                if(cabinet.isOpen){
                    _buildingUsedCabinets++;
                }
            }
        }

        var _buildingData = realTimeProcessor.get_data_by_identity(building) || {};
        var response = {
            serverNO: building.serverNO,
            classID: building.classID,
            id: building.id,
            name: building.fullName,
            cabinet: {
                rated: building.spec || 0,
                used: _buildingUsedCabinets
            },
            it: {
                rated: building.ratedITPower || 0,
                used: _buildingData.pw_it || 0
            },
            entry: {
                power: {
                    rated: 0,
                    used: 0
                },
                out_power: {
                    rated: 0,
                    used: 0
                }
            },
            cold: {
                rated: building.ratedColdPower || 0,
                used: _buildingData.cold || 0
            },
            ucold: {
                rated: building.unitColdPower || 0,
                used: _buildingData.ucold || 0
            }
        };

        var _mdPoints = [];
        if(building.mdPoint){
            _mdPoints.push(building.mdPoint);
        }

        var _pointData = undefined;
        var _mdData = undefined;

        var get_point_desc = function (point, value) {
            if(point && _pointData){
                var _key = format_key(point.serverNO, point.id, point.pointIndex);
                if(_pointData[_key]){
                    return _pointData[_key][value] || '未知';
                }
            }
            return '未知'
        };

        var format_data = function () {
            if(building.entry && building.entry.length > 0){
                for(var k=0;k<building.entry.length;k++){
                    var item = building.entry[k];
                    response.entry.power.rated += (item.ratedPower || 0);
                    response.entry.out_power.rated += (item.ratedOutPower || 0);
                }
                response.entry.power.rated = response.entry.power.rated / building.entry.length;
                response.entry.out_power.rated = response.entry.out_power.rated / building.entry.length;
            }

            var _areaData = realTimeProcessor.get_data_by_identity(building) || {};
            if(_areaData.entry && _areaData.entry.length > 0){
                for(var k=0;k<_areaData.entry.length;k++){
                    var item = _areaData.entry[k];
                    response.entry.power.used += (item.power || 0);
                    response.entry.out_power.used += (item.out_power || 0);
                }
            }

            var mode = 0;
            if(_mdData && building.mdPoint){
                var _point = building.mdPoint;
                if(_mdData[_point.serverNO] && _mdData[_point.serverNO][_point.id]){
                    mode = _mdData[_point.serverNO][_point.id][_point.pointIndex] || 0
                }
            }
            response.mode = mode;
            response.modeDesc = get_point_desc(building.mdPoint, mode);
        };

        if(_mdPoints.length > 0){
            ah.parallel([function (cb) {
                var _ps = [];
                for(var i=0;i<_mdPoints.length;i++){
                    var point = _mdPoints[i];
                    _ps.push({deviceServerNO: point.serverNO, deviceClassID: point.classID, deviceID: point.id, pointIndex: point.pointIndex});
                }

                db.dp.find_device_point({$or: _ps}, {deviceServerNO: 1, deviceClassID: 1, deviceID: 1, pointIndex: 1, description: 1}, function (err, points) {
                    if(err) logger.error(err);

                    if(points){
                        _pointData = {};
                        for(var i=0;i<points.length;i++){
                            var point = points[i];
                            var _key = format_key(point.deviceServerNO, point.deviceID, point.pointIndex);

                            if(point.description){
                                var _arr = point.description.split(';');
                                if(_arr && _arr.length > 0){
                                    _pointData[_key] = {};
                                    for(var j=0;j<_arr.length;j++){
                                        var item = _arr[j];
                                        if(item){
                                            var index = item.indexOf(',');
                                            if(index > 0){
                                                var v = item.substring(0, index);
                                                var d = item.substring(index + 1);

                                                _pointData[_key][v] = d;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    cb();
                })
            }, function (cb) {
                serverHelper.get_point_value_list(_mdPoints, function (err, data) {
                    if(err) logger.error(err);
                    _mdData = data;
                    cb();
                });
            }], function () {
                format_data();
                callback(null, response);
            });
        }else{
            format_data();

            callback(null, response);
        }
    }else{
        callback({status: code.not_found, msg: 'building not found'});
    }
}

module.exports.cmd = cmd.cpy_0x00000002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};