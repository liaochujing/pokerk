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
    var list = [];

    var _dic = {};
    if(body.deviceClassID){
        for(var i=0;i<body.deviceClassID.length;i++){
            var classID = body.deviceClassID[i];
            _dic[classID] = 1;
        }
    }

    for(var i=0;i<body.areas.length;i++){
        var item = body.areas[i];
        var building = undefined;
        if(item.classID == uiclassID.building){
            building = ramdb.no.get_by_identity(item);
        }else{
            var _building = ramdb.nor.get_parent_identity(item.serverNO, item.classID, item.id, uiclassID.building);
            if(_building){
                building = ramdb.no.get_by_identity(_building);
            }
        }

        var childs = ramdb.nor.get_child_identity_range(item.serverNO, item.classID, item.id, uiclassID.device, uiclassID.lastDevice);
        list.push({building: building, childs: childs});
    }

    var response = [];
    for(var i=0;i<list.length;i++){
        var item = list[i];
        var buildingName = undefined;
        if(item.building){
            buildingName = item.building.fullName;
        }
        if(item.childs){
            for(var j=0;j<item.childs.length;j++){
                var device = ramdb.no.get_by_identity(item.childs[j]);
                if(device && _dic[device.classID]){
                    var roomName = undefined;
                    var room = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.room));
                    if(room){
                        roomName = room.fullName;
                    }
                    var model = undefined;
                    var brand = undefined;
                    var pdDate = undefined;
                    var asset = ramdb.asset.get_asset_sync(device.aNO);
                    if(asset){
                        model = asset.model;
                        brand = asset.brand;
                        pdDate = asset.pdDate;
                    }
                    response.push({
                        building: buildingName,
                        room: roomName,
                        name: device.fullName,
                        model: model,
                        brand: brand,
                        pdDate: pdDate
                    })
                }
            }
        }
    }

    callback(null, response);
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010032;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areas: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true}
                }
            }
        },
        deviceClassID: {
            type: 'array',
            items: {
                type: 'number'
            }
        }
    }
};