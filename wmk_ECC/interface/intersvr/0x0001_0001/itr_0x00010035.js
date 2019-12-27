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
                    buildingItem.collectors.push({name: collector.fullName, type: collector.colType, guid: collector.guid})
                }
            }
        }

        response.push(buildingItem)
    }

    callback(null, response);
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010035;
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