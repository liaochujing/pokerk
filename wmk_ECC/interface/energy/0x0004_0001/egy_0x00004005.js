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

var realTimeDataProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var serverHelper = require('../../../protocol/central/interface_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {

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
        buildings: []
    };

    var buildings = ramdb.nor.get_child_identity(park.serverNO, park.classID, park.id, uiclassID.building);
    if(!buildings || buildings.length <= 0){
        callback(null, response);
        return;
    }

    var points = [];
    for(var i=0;i<buildings.length;i++){
        var building = ramdb.no.get_by_identity(buildings[i]);
        if(building && building.mdPoint){
            points.push(building.mdPoint);
        }
    }

    var _mdData = undefined;
    var _pointData = undefined;

    var get_point_desc = function (point, value) {
        if(point && _pointData){
            var _key = format_key(point.serverNO, point.id, point.pointIndex);
            if(_pointData[_key]){
                return _pointData[_key][value] || '未知';
            }
        }
        return '未知'
    };

    var get_point_data = function (done) {
        if(points.length > 0){
            var _ps = [];
            for(var i=0;i<points.length;i++){
                var point = points[i];
                _ps.push({deviceServerNO: point.serverNO, deviceClassID: point.classID, deviceID: point.id, pointIndex: point.pointIndex});
            }

            db.dp.find_device_point({$or: _ps}, {deviceServerNO: 1, deviceClassID: 1, deviceID: 1, pointIndex: 1, description: 1}, function (err, results) {
                if(err) logger.error(err);

                if(results){
                    _pointData = {};
                    for(var i=0;i<results.length;i++){
                        var point = results[i];
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

                done();
            })
        }else{
            done();
        }
    };

    var get_mode_data = function (done) {
        if(points.length > 0){
            serverHelper.get_point_value_list(points, function (err, data) {
                if(err) logger.error(err);
                _mdData = data;
                done();
            })
        }else{
            done();
        }
    };

    ah.parallel([get_point_data, get_mode_data], function () {
        for(var k=0;k<buildings.length;k++){
            var building = ramdb.no.get_by_identity(buildings[k]);
            if(building){
                var buildingItem = {
                    serverNO: building.serverNO,
                    classID: building.classID,
                    id: building.id,
                    name: building.fullName,
                    flow: 0,
                    in_water: 0,
                    out_water: 0,
                    cop: 0,
                    mode: 0,
                    modeDesc: '未知'
                };
                response.buildings.push(buildingItem);

                var data = realTimeDataProcessor.get_area_data_cache(building) || {};
                var flow = 0;
                var in_water = 0;
                var out_water = 0;
                var cop = 0;
                var mode = 0;

                if (data.water_flow) {
                    flow = data.water_flow;
                }
                if (data.in_water) {
                    in_water = data.in_water;
                }
                if (data.out_water) {
                    out_water = data.out_water;
                }
                if (data.cop) {
                    cop = data.cop;
                }
                var _mdPoint = building.mdPoint;
                if (_mdData && _mdPoint) {
                    if (_mdData[_mdPoint.serverNO]) {
                        var _item = _mdData[_mdPoint.serverNO][_mdPoint.id];
                        if (_item) {
                            mode = _item[_mdPoint.pointIndex];
                        }
                    }
                }

                buildingItem.flow = flow;
                buildingItem.in_water = in_water;
                buildingItem.out_water = out_water;
                buildingItem.cop = cop;
                buildingItem.mode = mode;
                buildingItem.modeDesc = get_point_desc(_mdPoint, mode);
            }
        }
        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00004005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'integer', required: true},
        classID: {type: 'integer', required: true},
        id: {type: 'integer', required: true}
    }
};