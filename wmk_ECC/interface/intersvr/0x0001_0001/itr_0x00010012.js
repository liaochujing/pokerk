/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');

var db = require('../../../db');
var ramdb = db.ramdb;
var dbAlarm = db.alarm;

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var _dic = {
        '50': 1,
        '51': 1,
        '52': 1,
        '54': 1,
    };

    var _list = [];

    var device = ramdb.no.get_by_identity(body.device);
    if(device){
        var temp = ramdb.dep.get_device_type(device.type);
        if(temp){
            for(var j=0;j<temp.pointList.length;j++){
                var _point = temp.pointList[j];
                if(_dic[_point.busType]){
                    _list.push({serverNO: device.serverNO, classID: device.classID, id: device.id, pointIndex: _point.pointIndex, name: _point.name, busType: _point.busType, timeList: [{from: startTime.AddMinutes(-8), to: endTime}]})
                }
            }
        }
    }

    if(_list.length > 0){
        var msg = new DataMessage(CentralCMD.cen_0x00030005, _list);
        dataHelper.send(msg, function (err, data) {
            if(err){
                callback({status: code.other, msg: err.msg});
                return;
            }
            callback(null, data);
        });
    }else{
        callback();
    }

    // var query = {/*classID: body.alarmClassID*/};
    //
    // var _and = [];
    // var _s = [];
    // for(var i=0;i<body.points.length;i++){
    //     var point = body.points[i];
    //     _s.push({'source.serverNO': point.serverNO, 'source.classID': point.classID, 'source.id': point.id, 'source.pointIndex': point.pointIndex})
    // }
    // _and.push({$or: _s});
    // _and.push({$or: [{startTime: {$gte: startTime, $lt: endTime}}, {endTime: {$gte: startTime, $lt: endTime}}]});
    // query['$and'] = _and;
    //
    // dbAlarm.find(query, {_id: 0, source: 1, startTime: 1, endTime: 1}).sort({startTime: 1}).exec(function (err, results) {
    //     if(err) logger.error(err);
    //     if(results){
    //         var dic = {};
    //         for(var i=0;i<results.length;i++){
    //             var item = results[i];
    //
    //             var source = item.source;
    //             var key = format_key(source.serverNO, source.classID, source.id, source.pointIndex);
    //             if(!dic[key]){
    //                 dic[key] = {serverNO: source.serverNO, classID: source.classID, id: source.id, pointIndex: source.pointIndex, timeList: []};
    //             }
    //
    //             var _start = item.startTime;
    //             if(_start < startTime){
    //                 _start = startTime;
    //             }
    //             var _end = item.endTime || endTime;
    //             dic[key].timeList.push({from: _start, to: _end});
    //         }
    //
    //         var list = [];
    //         for(var key in dic){
    //             list.push(dic[key]);
    //         }
    //
    //         if(list.length > 0){
    //             //扩大10分钟范围，保证可以取到放电前的数据
    //             for(var i=0;i<list.length;i++){
    //                 var item = list[i];
    //                 var _preTO = undefined;
    //                 for(var j=0;j<item.timeList.length;j++){
    //                     var timeItem = item.timeList[j];
    //
    //                     var _trans = timeItem.from.AddMinutes(-6);
    //                     if(_preTO && _preTO > _trans){
    //                         timeItem.from = _preTO;
    //                     }else{
    //                         timeItem.from = _trans;
    //                     }
    //                     _preTO = timeItem.to;
    //                 }
    //             }
    //
    //             var msg = new DataMessage(CentralCMD.cen_0x00030005, list);
    //             dataHelper.send(msg, function (err, data) {
    //                 if(err){
    //                     callback({status: code.other, msg: err.msg});
    //                     return;
    //                 }
    //                 callback(null, data);
    //             });
    //         }else{
    //             callback();
    //         }
    //     }else{
    //         callback();
    //     }
    // })
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010012;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        device: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            },
            required: true
        },
        startTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        endTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};