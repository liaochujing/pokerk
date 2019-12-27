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
var realTimeDataProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetDate().AddDays(-30);
    var endTime = new Date().GetDate();

    var response = {
        dayList: [],
        roomList: []
    };

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

    datadb.rmday.query(match, {id: 1, day: 1, pue: 1}, {time: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i in results){
                var item = results[i];
                if(!dic[item.day]){
                    dic[item.day] = {};
                }
                dic[item.day][item.id] = item.pue;
            }
        }

        for(var i in dic){
            response.dayList.push(i);
        }

        for(var j in roomList){
            var room = roomList[j];

            var data = realTimeDataProcessor.get_area_data_cache(room);
            var roomItem = {
                name: room.fullName,
                current: data ? data.pue || 0 : 0,
                data: []
            };

            for(var i in dic){
                var item = dic[i];
                roomItem.data.push(item[room.id] || 0)
            }

            response.roomList.push(roomItem);
        }

        callback(null, response)
    });
}

module.exports.cmd = cmd.cmd_0x00004021;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};