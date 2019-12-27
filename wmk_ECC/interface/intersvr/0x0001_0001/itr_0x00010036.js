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

    for(var i=0;i<body.buildings.length;i++){
        var building = body.buildings[i];

        var buildingItem = {
            serverNO: building.serverNO,
            classID: building.classID,
            id: building.id,
            name: building.fullName,
            collectors: []
        };
        var collectors = ramdb.cnor.get_child_identity_range(building.serverNO, 0, 0, uiclassID.collector);
        if(collectors){
            for(var j=0;j<collectors.length;j++){
                var collector = ramdb.cno.get_by_identity(collectors[j]);
                if(collector){
                    var collectorItem = {name: collector.fullName, deviceList: []};

                    var collectDeviceList = ramdb.cnor.get_child_identity_range(collector.serverNO, collector.classID, collector.id, uiclassID.cDevice, uiclassID.lastCObject);
                    if(collectDeviceList){
                        for(var k=0;k<collectDeviceList.length;k++){
                            var device = ramdb.cno.get_by_identity(collectDeviceList[k]);
                            if(device){
                                collectorItem.deviceList.push({name: device.fullName, cMode: device.cMode, cOption: device.cOption});
                            }
                        }
                    }

                    buildingItem.collectors.push(collectorItem)
                }
            }
        }

        response.push(buildingItem)
    }

    callback(null, response);
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010036;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        buildings: {
            type: 'array',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        }
    }
};