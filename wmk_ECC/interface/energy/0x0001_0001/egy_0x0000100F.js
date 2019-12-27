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

    var match = {};
    switch(body.classID){
        case uiclassID.park:
            break;
        case uiclassID.building:
            match.serverNO = body.serverNO;
            break;
        default:
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
            break;
    }
    var now = new Date();

    var _previousDic = {};
    function get_previous_energy(done) {
        var startTime = now.GetMonth().AddDays(-1);
        var endTime = now.GetDate();
        match.time = {$gte: startTime, $lt: endTime};

        if(startTime.getTime() == endTime.getTime()){
            done();
            return;
        }

        datadb.rmday.aggregate([
            {$match: match},
            {$group: {
                _id: {
                    serverNO: '$serverNO',
                    classID: '$classID',
                    id: '$id'
                },
                start: {$first: '$energy'},
                end: {$last: '$energy'}
            }},
            {$sort: {time: 1}}
        ], function (err, results) {
            if(err) logger.error(err);

            var _previousDic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var serverNO = item._id.serverNO;
                    var id = item._id.id;
                    if(!_previousDic[serverNO]){
                        _previousDic[serverNO] = {}
                    }
                    _previousDic[serverNO][id] = item;
                }
            }

            done();
        });
    }

    function get_today_energy(done) {
        var startTime = now.GetDate();
        var endTime = now;
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
            }},
            {$sort: {time: 1}}
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

            var roomList = areaHelper.get_data_room(body);
            for(var i=0;i<roomList.length;i++){
                var room = roomList[i];

                var _start = 0;
                var _end = 0;

                var _preItem = undefined;
                if(_previousDic[room.serverNO]){
                    _preItem = _previousDic[room.serverNO][room.id];
                }
                if(_preItem){
                    _start = _preItem.start || 0;
                    _end = _preItem.end || 0;
                }
                var dataItem = undefined;
                if(dic[room.serverNO]){
                    dataItem = dic[room.serverNO][room.id];
                }
                if(dataItem){
                    if(_start == 0){
                        _start = dataItem.start || 0;
                    }
                    if(dataItem.end){
                        _end = dataItem.end || 0;
                    }
                }
                var data = realTimeProcessor.get_area_data_cache(room);
                if(data && data.energy){
                    _end = data.energy;
                }

                response.push({name: room.fullName, value: format_value(_end - _start)});
            }

            done();
        });
    }

    get_previous_energy(function () {
        get_today_energy(function () {
            callback(null, response)
        })
    })
}

module.exports.cmd = cmd.cmd_0x0000100F;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};