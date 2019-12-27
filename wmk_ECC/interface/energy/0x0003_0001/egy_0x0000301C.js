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
        dayList: [],
        roomList: []
    };

    var startTime = new Date().GetDate().AddYear(-30);
    var endTime = new Date().GetDate();

    datadb.rmday.query({time: {$gte: startTime, $lt: endTime}}, {serverNO: 1, classID: 1, id: 1, day: 1, pue: 1}, function (err, results) {
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
                dic[item.day][item.serverNO][item.id] = item.pue;
            }
        }

        for(var i in dic){
            response.dayList.push(i);
        }

        var roomList = areaHelper.get_data_room(body);
        for(var i=0;i<roomList.length;i++){
            var room = roomList[i];

            var roomItem = {
                name: room.fullName,
                dataList: []
            };

            for(var k in dic){
                var dayItem = dic[k];
                var pue = 0;
                if(dayItem[room.serverNO]){
                    pue = dayItem[room.serverNO][item.id] || 0
                }
                roomItem.dataList.push(pue);
            }

            response.roomList.push(roomItem);
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x0000301C;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};