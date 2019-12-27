/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db');
var ramdb = db.ramdb;

var areaHelper = require('../../../helpers/area_helper');

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var rooms = [];
    var _dic = {};
    var areas = body.areas;
    for(var i=0;i<areas.length;i++){
        var _rooms = areaHelper.get_data_room(areas[i]);
        if(_rooms){
            for(var j=0;j<_rooms.length;j++){
                var room = _rooms[j];
                var _key = format_key(room.serverNO, room.classID, room.id);
                if(!_dic[_key]){
                    _dic[_key] = 1;
                    rooms.push({serverNO: room.serverNO, classID: room.classID, id: room.id})
                }
            }
        }
    }

    if(rooms && rooms.length > 0){
        db.datadb.rmdata.query({$or: rooms, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, day: 1, cTemp: 1, cHum: 1, time: 1}, function (err, results) {
            if(err) logger.error(err);
            var response = [];
            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var key = format_key(item.serverNO, item.classID, item.id);
                    if(!dic[key]){
                        dic[key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, data: {}};
                    }
                    var hour = item.time.format_hour();
                    if(!dic[key].data[hour]){
                        dic[key].data[hour] = {cTemp: 0, cTempCount: 0, cHum: 0, cHumCount: 0}
                    }
                    var _data = dic[key].data[hour];
                    if(item.cTemp){
                        _data.cTemp += item.cTemp;
                        _data.cTempCount++;
                    }
                    if(item.cHum){
                        _data.cHum += item.cHum;
                        _data.cHumCount++;
                    }
                }
            }
            for(var key in dic){
                var item = dic[key];

                item.list = [];
                for(var hour in item.data){
                    var _data = item.data[hour];

                    var cTemp = 0;
                    var cHum = 0;
                    if(_data.cTempCount){
                        cTemp = _data.cTemp / _data.cTempCount;
                    }
                    if(_data.cHumCount){
                        cHum = _data.cHum / _data.cHumCount;
                    }

                    item.list.push({hour: hour, cTemp: cTemp, cHum: cHum})
                }
                delete item.data;
            }
            for(var i=0;i<rooms.length;i++){
                var room = ramdb.no.get_by_identity(rooms[i]);
                if(room){
                    var key = format_key(room.serverNO, room.classID, room.id);
                    var data = dic[key] || {serverNO: room.serverNO, classID: room.classID, id: room.id, list: []};
                    data.room = room.fullName;
                    var building = ramdb.no.get_building(room.serverNO);
                    if(building){
                        data.building = building.fullName;
                    }
                    response.push(data);
                }
            }

            callback(null, response);
        })
    }else{
        callback()
    }
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010056;
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
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};