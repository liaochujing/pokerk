/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var dbNO = db.no;
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var rooms = [];
    for(var i=0;i<body.areas.length;i++){
        var item = body.areas[i];
        if(item.classID == uiclassID.room){
            var room = ramdb.no.get_by_identity(item);
            if(room){
                rooms.push(room);
            }
        }else{
            var _rooms = ramdb.nor.get_child_identity_range(item.serverNO, item.classID, item.id, uiclassID.room);
            if(_rooms){
                for(var j=0;j<_rooms.length;j++){
                    var room = ramdb.no.get_by_identity(_rooms[j]);
                    if(room){
                        rooms.push(room);
                    }
                }
            }
        }
    }

    dbNO.find_nameobject({}, {serverNO: 1, classID: 1, id: 1, 'restData.isOpen': 1, 'restData.openTime': 1}, function (err, results) {
        if(err) return callback(err);
        var _dic = {};
        for(var i=0;i<results.length;i++){
            var item = results[i];
            _dic[format_key(item.serverNO, item.classID, item.id)] = item;
        }

        var response = [];
        for(var i=0;i<rooms.length;i++){
            var buildingName = undefined;
            var roomName = undefined;
            var total = 0;
            var topen = 0;
            var open = 0;

            var room = rooms[i];
            var building = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(room.serverNO, room.classID, room.id, uiclassID.building));
            if(building){
                buildingName = building.fullName;
            }
            roomName = room.fullName;

            var cabinets = ramdb.nor.get_child_identity_range(room.serverNO, room.classID, room.id, uiclassID.cabinet);
            if(cabinets){
                for(var j=0;j<cabinets.length;j++){
                    var _identity = cabinets[j];
                    var cabinet = _dic[format_key(_identity.serverNO, _identity.classID, _identity.id)];
                    if(cabinet && cabinet.restData){
                        var _data = cabinet.restData;
                        total++;
                        if(_data.isOpen){
                            topen++;
                            if(_data.openTime > startTime && _data.openTime < endTime){
                                open++;
                            }
                        }
                    }
                }
            }
            response.push({
                building: buildingName,
                room: roomName,
                total: total,
                topen: topen,
                open: open
            })
        }

        callback(null, response);
    });
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010021;
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
            },
            required: true
        },
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};