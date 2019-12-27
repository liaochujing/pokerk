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

var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');
var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var startTime = new Date().GetDate();
    var endTime = new Date();

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

    datadb.rmdata.aggregate([
        {$match: match},
        {$group: {
            _id: {
                serverNO: '$serverNO',
                classID: '$classID',
                id: '$id'
            },
            start: {$first: '$energy'},
            end: {$last: '$energy'}
        }}
    ], function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var serverNO = item._id.serverNO;
                var id = item._id.id;
                if(!dic[serverNO]){
                    dic[serverNO] = {}
                }
                dic[serverNO][id] = item;
            }
        }

        for(var i=0;i<roomList.length;i++){
            var room = roomList[i];

            var energy = 0;
            var dataItem = undefined;
            if(dic[room.serverNO]){
                dataItem = dic[room.serverNO][room.id];
            }

            if(dataItem){
                var data = realTimeProcessor.get_area_data_cache(room);
                if(data){
                    if(data.energy){
                        energy = data.energy;
                        energy-=(dataItem.start || 0);
                    }
                }else{
                    energy = (dataItem.end || 0) - (dataItem.start || 0)
                }
            }

            response.push({name: room.fullName, value: format_value(energy)});
        }

        callback(null, response);
    });

}

module.exports.cmd = cmd.cmd_0x00001009;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};