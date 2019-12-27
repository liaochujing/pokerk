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

var realTimeProcessor = require('../../../modules/capacity/processor/real_time_data_processor');

function handle(req, res, body, callback) {
    var response = [];

    var buildings = ramdb.no.get_by_class(uiclassID.building);
    if(buildings){
        for(var i=0;i<buildings.length;i++){
            var building = buildings[i];
            var _buildingData = realTimeProcessor.get_data_by_identity(building) || {};

            var usedCabinets = 0;
            var cabinets = ramdb.no.get_by_class(uiclassID.cabinet, building.serverNO);
            if(cabinets){
                for(var j=0;j<cabinets.length;j++){
                    var cabinet = cabinets[j];
                    if(cabinet.isOpen){
                        usedCabinets++;
                    }
                }
            }
            var entry = {
                rated: 0,
                used: 0
            };



            if(building.entry && building.entry.length > 0){
                var _rated = 0;
                for(var k=0;k<building.entry.length;k++){
                    var item = building.entry[k];
                    _rated += (item.ratedPower || 0);
                }
                entry.rated += _rated / building.entry.length;
            }
            if(_buildingData && _buildingData.entry && _buildingData.entry.length > 0){
                for(var k=0;k<_buildingData.entry.length;k++){
                    var item = _buildingData.entry[k];
                    entry.used += (item.power || 0);
                }
            }

            var buildingItem = {
                serverNO: building.serverNO,
                classID: building.classID,
                id: building.id,
                name: building.fullName,
                cabinet: {
                    rated: building.spec || 0,
                    used: usedCabinets
                },
                it: {
                    rated: building.ratedITPower || 0,
                    used: _buildingData.pw_it || 0
                },
                entry: entry,
                cold: {
                    rated: building.ratedColdPower || 0,
                    used: _buildingData.cold || 0
                }
            };

            response.push(buildingItem)
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.cpy_0x00000001;
module.exports.handle = handle;