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
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);
    var interval = endTime - startTime;
    var days = interval / 3600000 / 24;
    if(days > 1){
        callback({status: code.unknown, msg: '查询时间范围，不能超过1天'});
        return;
    }

    var ramdb = db.ramdb;
    var rno = ramdb.no;
    var rnor = ramdb.nor;
    var rdep = ramdb.dep;

    var msg = new DataMessage(CentralCMD.cen_0x00030002, body);
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
                    var _dic = {};
                    for(var j=0;j<_list.length;j++){
                        var _item = _list[j];

                        var _time = new Date(_item.t);
                        var hour = _time.getHours();
                        var minute = _time.getMinutes();
                        var second = _time.getSeconds();

                        var interval = minute * 60 + second;
                        if(minute >= 30){
                            hour++;
                            interval = 60 * 60 - minute * 60 - second;
                        }
                        if(!_dic[hour]){
                            _dic[hour] = {interval: interval, value: _item.v};
                        }else{
                            if(_dic[hour].interval > interval){
                                _dic[hour] = {interval: interval, value: _item.v};
                            }
                        }
                    }

                    var resList = [];
                    var _preValue = undefined;
                    for(var j=0;j<24;j++){
                        var v1 = _preValue;
                        var v2 = undefined;
                        if(_dic[j]){
                            v1 = _dic[j].value;
                        }
                        if(_dic[j + 1]){
                            v2 = _dic[j + 1].value;
                        }

                        _preValue = v1;
                        if(v1 != undefined && v2 != undefined){
                            resList.push({hour: j, value: format_value(v2 - v1)});
                        }else{
                            resList.push({hour: j, value: 0})
                        }
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
module.exports.cmd = cmd.itr_0x00010041;
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