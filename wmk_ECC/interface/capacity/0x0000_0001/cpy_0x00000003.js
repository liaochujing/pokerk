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

var deviceHelper = require('../../../helpers/device_helper');
var serverHelper = require('../../../protocol/central/interface_helper');
var realTimeProcessor = require('../../../modules/capacity/processor/real_time_data_processor');

function handle(req, res, body, callback) {
    var room = ramdb.no.get_by_identity(body);
    if(room){
        var _roomUsedCabinets = 0;
        var _roomData = realTimeProcessor.get_data_by_identity(room) || {};

        var response = {
            serverNO: room.serverNO,
            classID: room.classID,
            id: room.id,
            name: room.fullName,
            cabinet: {
                rated: room.spec || 0,
                used: 0
            },
            it: {
                rated: room.ratedITPower || 0,
                used: _roomData.pw_it || 0
            },
            cold: {
                rated: room.ratedColdPower || 0,
                used: _roomData.cold || 0
            },
            ac: {
                total: 0,
                used: 0
            },
            columns: []
        };
        
        var columns = ramdb.nor.get_child_identity(room.serverNO, room.classID, room.id, uiclassID.rowCabinet);
        if(columns && columns.length > 0){
            for(var i=0;i<columns.length;i++){
                var column = ramdb.no.get_by_identity(columns[i]);

                if(column){
                    var _columnItem = {
                        serverNO: column.serverNO,
                        classID: column.classID,
                        id: column.id,
                        fullName: column.fullName,
                        name: column.name,
                        cabinets: []
                    };
                    var cabinets = ramdb.nor.get_child_identity(column.serverNO, column.classID, column.id, uiclassID.cabinet);
                    for(var j=0;j<cabinets.length;j++){
                        var cabinet = ramdb.no.get_by_identity(cabinets[j]);
                        if(cabinet){
                            if(cabinet.isOpen){
                                _roomUsedCabinets++;
                            }
                            var _cabinetData = realTimeProcessor.get_data_by_identity(cabinet);
                            _columnItem.cabinets.push({
                                fullName: cabinet.fullName,
                                name: cabinet.name,
                                isOpen: cabinet.isOpen || 0,
                                rated: cabinet.ratedPower,
                                used: _cabinetData ? format_value(_cabinetData.power) : 0
                            })
                        }
                    }
                    response.columns.push(_columnItem);
                }
            }
        }
        response.cabinet.used = _roomUsedCabinets;
        
        var get_ac_info = function (done) {
            var acs = ramdb.nor.get_child_identity_list(room.serverNO, room.classID, room.id, uiclassID.AC_List);
            if(acs && acs.length > 0){
                response.ac.total = acs.length;
                if(room.acPoint){
                    serverHelper.get_point_value_list([room.acPoint], function (err, data) {
                        if(err) logger.error(err);
                        if(data){
                            var _acUsed = 0;
                            var _p = room.acPoint;
                            if(data[_p.serverNO] && data[_p.serverNO][_p.id]){
                                _acUsed = data[_p.serverNO][_p.id][_p.pointIndex];
                            }
                            if(_acUsed){
                                response.ac.used = _acUsed;
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

        ah.series([get_ac_info], function () {
            callback(null, response);
        });
    }else{
        callback({status: code.not_found, msg: 'room not found'});
    }
}

module.exports.cmd = cmd.cpy_0x00000003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};