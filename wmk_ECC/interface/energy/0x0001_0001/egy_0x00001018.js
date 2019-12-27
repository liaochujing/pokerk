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
var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var endTime = new Date().GetDate();
    var startTime = new Date().GetMonth();

    var response = [];

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

    datadb.rmday.aggregate([
        {$match: match},
        {$group: {
            _id: {
                serverNO: '$serverNO',
                classID: '$classID',
                id: '$id'
            },
            power: {$avg: '$power'}
        }}
    ], function (err, results) {
        if(err) logger.error(err);
        if(results){
            var dic = {};
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var serverNO = item._id.serverNO;
                var id = item._id.id;
                if(!dic[serverNO]){
                    dic[serverNO] = {};
                }
                dic[serverNO][id] = format_value(item.power);
            }

            for(var i=0;i<roomList.length;i++){
                var room = roomList[i];

                var value = 0;
                if(dic[room.serverNO]){
                    value = dic[room.serverNO][room.id]
                }
                response.push({
                    name: room.fullName,
                    power: format_value(value || 0),
                    ratedPower: room.ratedITPower
                })
            }

            callback(null, response)

        }else{//没有数据时取当前数据
            for(var i=0;i<roomList.length;i++){
                var room = roomList[i];

                var cacheItem = realTimeProcessor.get_area_data_cache(room);
                response.push({
                    name: room.fullName,
                    power: cacheItem ? format_value(cacheItem.power) || 0 : 0,
                    ratedPower: room.ratedITPower
                })
            }

            callback(null, response)
            
        }
    });
}

module.exports.cmd = cmd.cmd_0x00001018;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};