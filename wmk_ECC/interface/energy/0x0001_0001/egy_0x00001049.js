/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = {
        dayList: [],
        roomList: []
    };

    var startTime = new Date().GetDate().AddDays(-30);
    var endTime = new Date().GetDate();

    var roomList = areaHelper.get_data_room(body);
    var match = {};
    if(roomList && roomList.length > 0){
        var rooms = [];
        for(var i=0;i<roomList.length;i++){
            var room = roomList[i];
            rooms.push({serverNO: room.serverNO, classID: room.classID, id: room.id})
        }
        match['$or'] = rooms;
    }else{
        callback(null, response);
        return;
    }
    match.time = {$gte: startTime, $lt: endTime};

    datadb.rmday.query(match, {serverNO: 1, id: 1, day: 1, coldENUsage: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                if(!dic[item.day]){
                    dic[item.day] = {};
                }
                if(!dic[item.day][item.serverNO]){
                    dic[item.day][item.serverNO] = {};
                }
                dic[item.day][item.serverNO][item.id] = item.coldENUsage;
            }
        }

        for(var i in dic){
            response.dayList.push(i);
        }

        for(var i=0;i<roomList.length;i++){
            var room = roomList[i];

            var roomItem = {
                serverNO: room.serverNO,
                classID: room.classID,
                id: room.id,
                name: room.fullName,
                data: []
            };

            for(var j in dic){
                var dayItem = dic[j];
                var value = 0;
                if(dayItem[room.serverNO]){
                    value = dayItem[room.serverNO][room.id]
                }
                roomItem.data.push(value || 0);
            }
            response.roomList.push(roomItem)
        }

        callback(null, response);
    })

}

module.exports.cmd = cmd.cmd_0x00001049;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};