/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var areaHelper = require('../../../helpers/area_helper');
var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var rooms = [];
    for(var i=0;i<body.areas.length;i++){
        var area = body.areas[i];
        if(area.classID == uiclassID.room){
            rooms.push(area);
        }else{
            var _rooms = areaHelper.get_data_room(area);
            if(_rooms){
                for(var j=0;j<_rooms.length;j++){
                    var room = _rooms[j];
                    rooms.push({serverNO: room.serverNO, classID: room.classID, id: room.id})
                }
            }
        }
    }

    if(rooms.length > 0){
        db.datadb.rmday.query({$or: rooms, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, enUsage: 1, day: 1}, {time: 1}, function (err, results) {
            if(err) logger.error(err);

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var key = format_key(item.serverNO, item.classID, item.id);
                    if(!dic[key]){
                        dic[key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []};
                    }
                    dic[key].list.push({day: item.day, energy: item.enUsage});
                }
            }

            var response = [];
            for(var i in dic){
                var item = dic[i];
                var building = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(item.serverNO, item.classID, item.id, uiclassID.building));
                if(building){
                    item.building = building.fullName;
                }
                var room = ramdb.no.get_by_identity(item);
                if(room){
                    item.name = room.fullName;
                }
                response.push(item);
            }

            callback(null, response)
        })
    }else{
        callback();
    }
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010053;
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