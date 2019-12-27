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
var dbCAPSL = db.datadb.capsl;

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var filters = [];
    var _keyDic = {};
    for(var i=0;i<body.areas.length;i++){
        var area = body.areas[i];
        if(area.classID == uiclassID.cabinet){
            filters.push({serverNO: area.serverNO, classID: area.classID, id: area.id});
        }else if(area.classID == uiclassID.room){
            var room = area;
            var _key = format_key(room.serverNO, room.id);
            if(!_keyDic[_key]){
                _keyDic[_key] = 1;
                filters.push({serverNO: room.serverNO, areaID: room.id});
            }
        }else{
            var rooms = areaHelper.get_data_room(area);
            for(var j=0;j<rooms.length;j++){
                var room = rooms[j];
                var _key = format_key(room.serverNO, room.id);
                if(!_keyDic[_key]){
                    _keyDic[_key] = 1;
                    filters.push({serverNO: room.serverNO, areaID: room.id});
                }
            }
        }
    }
    if(filters.length == 0){
        callback();
        return;
    }

    dbCAPSL.find_log({$or: filters, start: {$gte: startTime, $lt: endTime}, end: {$gte: startTime, $lt: endTime}}, {_id: 0, areaID: 0}, function (err, results) {
        if(err) logger.error(err);

        var response = [];

        if(results){
            var dic = {};
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var key = format_key(item.serverNO, item.id);
                if(!dic[key]){
                    dic[key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []};
                    var cabinet = ramdb.no.get_by_identity(item);
                    if(cabinet){
                        dic[key].name = cabinet.fullName;
                    }
                    response.push(dic[key]);
                }
                dic[key].push({start: item.start, end: item.end});
            }
        }

        callback(null, response)
    })
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010059;
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