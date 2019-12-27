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
    var building = ramdb.no.get_by_identity(body);
    if(!building){
        callback();
        return;
    }

    var response = {
        serverNO: building.serverNO,
        classID: building.classID,
        id: building.id,
        name: building.fullName,
        cabinet: {
            total: 0,
            open: 0
        },
        it: {
            rated: building.ratedITPower || 0,
            used: 0
        }
    };

    var cabinets = ramdb.no.get_by_class(uiclassID.cabinet, body.serverNO);
    if(cabinets){
        response.cabinet.total = cabinets.length;
        for(var i=0;i<cabinets.length;i++){
            var cabinet = cabinets[i];
            if(cabinet.isOpen){
                response.cabinet.open++;
            }
        }
    }
    var _buildingData = realTimeProcessor.get_data_by_identity(body) || {};
    if(_buildingData){
        response.it.used = _buildingData.pw_it || 0
    }

    callback(null, response);
}

module.exports.cmd = cmd.cpy_0x00010002;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};