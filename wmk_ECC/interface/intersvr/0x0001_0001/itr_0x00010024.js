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

    var _dic = {};
    for(var k=0;k<body.areas.length;k++){
        var area = body.areas[k];
        var devices = ramdb.nor.get_child_identity_range(area.serverNO, area.classID, area.id, uiclassID.device, uiclassID.lastDevice);
        if(devices){
            for(var i=0;i<devices.length;i++){
                var device = ramdb.no.get_by_identity(devices[i]);
                if(device.aNO){
                    var asset = ramdb.asset.get_asset_sync(device.aNO);
                    if(asset){
                        if(!_dic[device.aNO]){
                            _dic[device.aNO] = 1;

                            var buildingName = undefined;
                            var roomName = undefined;
                            var building = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.building));
                            if(building){
                                buildingName = building.fullName;
                            }
                            var room = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.room));
                            if(room){
                                roomName = room.fullName;
                            }

                            response.push({
                                building: buildingName,
                                room: roomName,
                                aNO: asset.aNO,
                                name: asset.name,
                                type: asset.type,
                                ratedPower: asset.ratedPower
                            })
                        }
                    }
                }
            }
        }
    }


    callback(null, response);
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010024;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areas: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            },
            required: true
        }
    }
};