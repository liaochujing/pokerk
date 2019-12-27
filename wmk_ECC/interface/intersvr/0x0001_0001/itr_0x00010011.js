/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var PrivilegePoint = require('../../../definition/privilege_point');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');

var db = require('../../../db');

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);
    var interval = endTime - startTime;
    var days = interval / 3600000 / 24;
    if(days > 30){
        callback({status: code.unknown, msg: '查询天数不能超过30天!'});
        return;
    }
    if(days * body.points.length * 288 > 100000){
        callback({status: code.unknown, msg: '查询数据量超过10W，请分批查询!'});
        return;
    }

    var ramdb = db.ramdb;
    var rno = ramdb.no;
    var rnor = ramdb.nor;
    var rdep = ramdb.dep;

    var msg = new DataMessage(CentralCMD.cen_0x00030001, body);
    dataHelper.send(msg, function (err, data) {
        if(err){
            return callback({status: code.other, msg: err.msg});
        }

        for(var i=0;i<data.length;i++){
            var item = data[i];

            var device = ramdb.no.get_no_sync(item.serverNO, item.classID, item.id);
            if(device){
                item.device = device.fullName;
                var _room = rnor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.room);
                var room = rno.get_by_identity(_room);
                if(room){
                    item.room = room.fullName;

                    var _building = rnor.get_parent_identity(room.serverNO, room.classID, room.id, uiclassID.building);
                    var building = rno.get_by_identity(_building);
                    if(building){
                        item.building = building.fullName;
                    }
                }else{
                    var _building = rnor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.building);
                    var building = rno.get_by_identity(_building);
                    if(building){
                        item.building = building.fullName;
                    }
                }

                var point = rdep.get_device_type_point(device.type, item.pointIndex);
                if(point){
                    item.point = point.name;
                }
            }
        }

        callback(null, data);
    });
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010011;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        points: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true},
                    pointIndex: {type: 'number', required: true}
                }
            }
        },
        startTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        endTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};