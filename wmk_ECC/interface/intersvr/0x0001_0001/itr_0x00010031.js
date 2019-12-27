/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var response = [];

    for(var i=0;i<body.rooms.length;i++){
        var room = ramdb.no.get_by_identity(body.rooms[i]);
        if(room){
            var buildingName = undefined;
            var _building = ramdb.nor.get_parent_identity(room.serverNO, room.classID, room.id, uiclassID.building);
            if(_building){
                var building = ramdb.no.get_by_identity(_building);
                if(building){
                    buildingName = building.fullName;
                }
            }
            var cabinets = ramdb.nor.get_child_identity_range(room.serverNO, room.classID, room.id, uiclassID.cabinet);
            if(cabinets){
                var spec = 0;
                var pdu = 0;
                for(var j=0;j<cabinets.length;j++){
                    var cabinet = ramdb.no.get_by_identity(cabinets[j]);
                    if(cabinet){
                        spec+=cabinet.spec;
                        pdu+=cabinet.pdu;
                    }

                    response.push({
                        serverNO: room.serverNO,
                        building: buildingName,
                        room: room.fullName,
                        cabinet: cabinet.fullName,
                        ratedPower: cabinet.ratedPower || 0,//额定功耗
                        spec: spec,
                        pdu: pdu
                    })
                }
            }
        }
    }

    callback(null, response);
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010031;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        rooms: {
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
        }
    }
};