/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var ramdb = db.ramdb;
    var rno = ramdb.no;
    var rnor = ramdb.nor;
    var rdep = ramdb.dep;
    var rAsset = ramdb.asset;

    var query = {};

    if(body.areas){
        var _areas = [];
        for(var i=0;i<body.areas.length;i++){
            var area = body.areas[i];

            if(area.classID == uiclassID.park){
                var buildings = db.ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id, uiclassID.building);
                var mNOS = [area.serverNO];
                for(var j in buildings){
                    var item = buildings[j];
                    mNOS.push(item.serverNO);
                }
                _areas.push({serverNO: {$in: mNOS}});
            }else if(area.classID == uiclassID.building){
                _areas.push({serverNO: area.serverNO});
            }else{
                var idList = [area.id];

                var areaList = db.ramdb.nor.get_child_identity_area(area.serverNO, area.classID, area.id);
                if(areaList){
                    for(var j in areaList){
                        idList.push(areaList[j].id);
                    }
                }
                _areas.push({serverNO: area.serverNO, area: {$in: idList}});
            }
        }
        query['$or'] = _areas;
    }
    if(body.deviceClassID && body.deviceClassID.length > 0){
        query['source.classID'] = {$in: body.deviceClassID};
    }
    if(body.alarmClassID != undefined && body.alarmClassID.length > 0){
        query.classID = {$in: body.alarmClassID};
    }
    if(body.levels != undefined && body.levels.length > 0){
        query.level = {$in: body.levels};
    }
    query.isEnd = {$ne: 1};//为自动结束

    if(body.startTime){
        query.startTime = {$gte: new Date(body.startTime)};
    }
    if(body.endTime){
        if(!query.startTime){
            query.startTime = {};
        }
        query.startTime['$lt'] = new Date(body.endTime);
    }

    db.alarm.find_alarm(query, {_id: 0, serverNO: 1, id: 1, source: 1, level: 1, startTime: 1, desc: 1, 'start.pointValue': 1}, function (err, alarms) {
        if(err) return callback({status: code.unknown, msg: err.message});
        var result = [];
        for(var i=0;i<alarms.length;i++){
            var record = alarms[i];

            var source = record.source;

            var roomName = undefined;
            var _room = rnor.get_parent_identity(source.serverNO, source.classID, source.id, uiclassID.room);
            if(_room){
                var obj = rno.get_by_identity(_room);
                if(obj){
                    roomName = obj.fullName;
                }
            }

            var deviceName = undefined;
            var pointName = undefined;
            var model = undefined;
            var brand = undefined;
            var device = rno.get_no_sync(source.serverNO, source.classID, source.id);
            if(device){
                deviceName = device.fullName;
                var asset = rAsset.get_asset_sync(device.aNO);
                if(asset){
                    model = asset.model;
                    brand = asset.brand;
                }
                if(source.pointIndex != undefined){
                    var point = rdep.get_device_type_point(device.type, source.pointIndex);
                    if(point){
                        pointName = point.name;
                    }
                }
            }

            var item = {
                serverNO: record.serverNO,
                id: record.id,
                room: roomName,
                deviceClassID: source.classID,
                device: deviceName,
                model: model,
                brand: brand,
                point: pointName || '',
                value: record.start ? record.start.pointValue : undefined,
                level: record.level,
                startTime: record.startTime,
                desc: record.desc
            };

            result.push(item);
        }

        callback(null, result);
    });
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areas: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true}
                }
            },
            required: true
        },
        deviceClassID: {
            type: 'array',
            items: {type: 'number'}
        },
        alarmClassID: {
            type: 'array',
            items: {type: 'number'}
        },
        levels: {
            type: 'array',
            items: {type: 'number'}
        },
        startTime: {type: 'string'},
        endTime: {type: 'string'}
    }
};