/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db');

function handle(req, res, body, callback) {
    var ramdb = db.ramdb;
    var rno = ramdb.no;
    var rnor = ramdb.nor;
    var rdep = ramdb.dep;

    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime).AddYear(1);

    var nowDay = new Date().GetDate();
    if(startTime >= nowDay){
        callback();
        return;
    }

    var timeList = [];
    var _start = startTime;
    while(_start < endTime){
        if(_start < nowDay){
            timeList.push(_start);
        }else{
            timeList.push(nowDay);
            break;
        }
        _start = _start.AddYear(1);
    }
    var msg = new DataMessage(CentralCMD.cen_0x00030004, {points: body.points, timeList: timeList});
    dataHelper.send(msg, function (err, data) {
        if(err){
            return callback({status: code.other, msg: err.msg});
        }

        var res = [];
        if(data){
            for(var i=0;i<data.length;i++){
                var item = data[i];

                var _list = item.list;
                if(_list){
                    var resList = [];

                    var _dic = {};
                    for(var j=0;j<_list.length;j++){
                        var _item = _list[j];
                        var key = new Date(_item.t).format_day();
                        _dic[key] = _item.v;
                    }

                    if(timeList.length >= 2){
                        for(var j=0;j<timeList.length - 2;j++){
                            var _time1 = timeList[j];
                            var key1 = _time1.format_day();

                            var _time2 = timeList[j + 1];
                            var key2 = _time2.format_day();

                            var v1 = _dic[key1] || 0;
                            var v2 = _dic[key2] || 0;
                            resList.push({year: _time1.format_year(), value: format_value(v2 - v1)});
                        }

                        var _time1 = timeList[timeList.length - 2];
                        var key1 = _time1.format_day();

                        var _time2 = timeList[timeList.length - 1];
                        var key2 = _time2.format_day();

                        var v1 = _dic[key1] || 0;
                        var v2 = _dic[key2] || 0;
                        resList.push({year: _time1.format_year(), value: format_value(v2 - v1)});
                    }

                    item.list = resList;
                }

                var device = ramdb.no.get_no_sync(item.serverNO, item.classID, item.id);
                if(device){
                    item.device = device.fullName;
                    var _room = rnor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.room);
                    var room = rno.get_by_identity(_room);
                    if(room){
                        item.room = room.fullName;

                        var _building = rnor.get_parent_identity(room.serverNO, room.classID, room.id, uiclassID.building);
                        var building = rno.get_by_identity(_building);
                        if(building){
                            item.building = building.fullName;
                        }
                    }else{
                        var _building = rnor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.building);
                        var building = rno.get_by_identity(_building);
                        if(building){
                            item.building = building.fullName;
                        }
                    }

                    var point = rdep.get_device_type_point(device.type, item.pointIndex);
                    if(point){
                        item.point = point.name;
                    }
                }
            }
        }

        callback(null, data);
    });
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010045;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        points: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true},
                    pointIndex: {type: 'number', required: true}
                }
            },
            required: true
        },
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};