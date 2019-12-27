/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;

var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = {
        monthList: [],
        roomList: []
    };

    var startTime = new Date().GetMonth().AddMonth(-12);
    var endTime = new Date().GetMonth();

    var match = {};
    var roomList = areaHelper.get_data_room(body);
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

    datadb.rmmon.query(match, {serverNO: 1, id: 1, month: 1, coldENUsage: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                if(!dic[item.month]){
                    dic[item.month] = {};
                }
                if(!dic[item.month][item.serverNO]){
                    dic[item.month][item.serverNO] = {};
                }
                dic[item.month][item.serverNO][item.id] = item.coldENUsage;
            }
        }

        for(var i in dic){
            response.monthList.push(i);
        }

        for(var i=0;i<roomList.length;i++){
            var room = roomList[i];

            var roomItem = {
                name: room.fullName,
                data: []
            };

            for(var j in dic){
                var monthItem = dic[j];

                var coldENUsage = 0;
                if(monthItem[room.serverNO]){
                    coldENUsage = monthItem[room.serverNO][room.id];
                }
                roomItem.data.push(coldENUsage || 0);
            }
            response.roomList.push(roomItem)
        }

        callback(null, response);
    })

}

module.exports.cmd = cmd.cmd_0x0000104A;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};