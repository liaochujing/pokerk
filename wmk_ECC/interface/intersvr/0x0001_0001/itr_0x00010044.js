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
    var endTime = new Date(body.endTime);
    var nowDay = new Date().GetDate();
    if(startTime >= nowDay){
        callback();
        return;
    }

    var month = body.month;

    var monthList = [];
    var timeList = [];
    var _start = startTime.GetYear();
    while(_start < endTime){
        var _time1 = _start.AddMonth(month - 1);
        var _time2 = _start.AddMonth(month);

        if(_time1 < nowDay || _time2 < nowDay){
            if(_time1 > nowDay){
                _time1 = nowDay;
            }
            if(_time2 > nowDay){
                _time2 = nowDay;
            }

            timeList.push(_time1);
            timeList.push(_time2);

            monthList.push({month: _time1.format_month(), time1: _time1, time2: _time2});
        }else{
            break;
        }

        _start = _start.AddYear(1);
    }

    var msg = new DataMessage(CentralCMD.cen_0x00030004, {points: body.points, timeList: timeList});
    dataHelper.send(msg, function (err, data) {
        if(err){
            return callback({status: code.other, msg: err.msg});
        }

        var response = [];
        if(data){
            var valueDic = {};
            for(var i=0;i<data.length;i++) {
                var item = data[i];
                if (item.list) {
                    var _dic = {};
                    for (var j = 0; j < item.list.length; j++) {
                        var _item = item.list[j];
                        var key = new Date(_item.t).format_day();
                        _dic[key] = _item.v;
                    }
                    valueDic[format_key(item.serverNO, item.id, item.pointIndex)] = _dic;
                }
            }

            for(var i=0;i<body.points.length;i++){
                var item = body.points[i];

                var _dic = valueDic[format_key(item.serverNO, item.id, item.pointIndex)] || {};
                var _resList = [];
                for(var j=0;j<monthList.length;j++){
                    var _item = monthList[j];

                    var v1 = _dic[_item.time1.format_day()] || 0;
                    var v2 = _dic[_item.time2.format_day()] || 0;
                    _resList.push({month: _item.month, value: format_value(v2 - v1)})
                }

                var respItem = {serverNO: item.serverNO, classID: item.classID, id: item.id, pointIndex: item.pointIndex};
                respItem.list = _resList;
                var device = ramdb.no.get_no_sync(item.serverNO, item.classID, item.id);
                if(device){
                    respItem.device = device.fullName;
                    var _room = rnor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.room);
                    var room = rno.get_by_identity(_room);
                    if(room){
                        respItem.room = room.fullName;

                        var _building = rnor.get_parent_identity(room.serverNO, room.classID, room.id, uiclassID.building);
                        var building = rno.get_by_identity(_building);
                        if(building){
                            respItem.building = building.fullName;
                        }
                    }else{
                        var _building = rnor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.building);
                        var building = rno.get_by_identity(_building);
                        if(building){
                            respItem.building = building.fullName;
                        }
                    }
                    var point = rdep.get_device_type_point(device.type, item.pointIndex);
                    if(point){
                        respItem.point = point.name;
                    }
                }
                response.push(respItem)
            }
        }

        callback(null, response);
    });
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010044;
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
        month: {type: 'number', required: true},
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};