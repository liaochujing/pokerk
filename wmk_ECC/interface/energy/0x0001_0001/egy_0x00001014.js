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
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetMonth().AddMonth(-7);
    var endTime = new Date().GetMonth();

    var response = {
        monthList: [],
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

    datadb.rmmon.query(match, {id: 1, month: 1, pue: 1}, function (err, datas) {
        if(err) logger.error(err);

        if(datas){
            var systemItemDic = {};
            for(var i in datas){
                var item = datas[i];
                if(!systemItemDic[item.month]){
                    systemItemDic[item.month] = {};
                }
                systemItemDic[item.month][item.id] = item.pue;
            }

            for(var j in roomList){
                var room = roomList[j];
                response.roomList.push({
                    name: room.fullName,
                    data: []
                })
            }

            for(var i in systemItemDic){
                var item = systemItemDic[i];
                response.monthList.push(i);

                var index = 0;
                for(var j in roomList){
                    var room = roomList[j];

                    var sysItem = response.roomList[index];

                    sysItem.data.push(item[room.id] || 0);
                    index++;
                }
            }

            callback(null, response)
        }
    });
}

module.exports.cmd = cmd.cmd_0x00001014;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};