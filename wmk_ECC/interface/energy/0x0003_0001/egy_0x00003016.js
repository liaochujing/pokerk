/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;

var areaHelper= require('../../../helpers/area_helper');
var realTimeDataProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var startTime = new Date().GetDate().AddDays(-3);
    var endTime = new Date().GetDate();

    datadb.rmday.aggregate([
        {$match: {time: {$gte: startTime, $lt: endTime}}},
        {$group: {
            _id: {
                serverNO: '$serverNO',
                classID: '$classID',
                id: '$id'
            },
            energy: {$last: '$energy'}
        }}
    ], function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i in results){
                var item = results[i];

                var id = item._id;
                if(!dic[id.serverNO]){
                    dic[id.serverNO] = {};
                }
                dic[id.serverNO][id.id] = item.energy;
            }
        }

        var roomList = areaHelper.get_data_room(body);
        if(roomList){
            for(var i=0;i<roomList.length;i++){
                var room = roomList[i];

                var data = realTimeDataProcessor.get_area_data_cache(room);
                var enUsage = 0;
                if(data){
                    var pre = 0;
                    if(dic[room.serverNO]){
                        pre = dic[room.serverNO][room.id] || 0;
                    }

                    enUsage = format_value(data.energy - pre);
                }

                response.push({
                    serverNO: room.serverNO,
                    classID: room.classID,
                    id: room.id,
                    name: room.fullName,
                    enUsage: enUsage
                })
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00003016;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};