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
    var park = ramdb.no.get_by_identity(body);
    if(!park){
        callback();
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
    if(buildings){
        for(var i=0;i<buildings.length;i++){
            var _building = ramdb.no.get_by_identity(buildings[i]);
            if(_building){
                var buildingItem = {
                    serverNO: _building.serverNO,
                    classID: _building.classID,
                    id: _building.id,
                    name: _building.fullName,
                    cabinet: {
                        total: 0,
                        open: 0
                    },
                    it: {
                        rated: _building.ratedITPower || 0,
                        used: 0
                    }
                };

                var cabinets = ramdb.no.get_by_class(uiclassID.cabinet, _building.serverNO);
                if(cabinets){
                    buildingItem.cabinet.total = cabinets.length;
                    for(var k=0;k<cabinets.length;k++){
                        var cabinet = cabinets[k];
                        if(cabinet.isOpen){
                            buildingItem.cabinet.open++;
                        }
                    }
                }

                var _buildingData = realTimeProcessor.get_data_by_identity(_building) || {};
                if(_buildingData){
                    buildingItem.it.used = _buildingData.pw_it || 0
                }

                response.buildings.push(buildingItem);
            }
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.cpy_0x00010001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};