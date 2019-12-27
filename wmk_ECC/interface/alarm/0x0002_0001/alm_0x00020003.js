/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var area_helper = require('../../../helpers/area_helper');

function handle(req, res, body, callback) {
    var dbHisAlarm = db.datadb.hisalarm;
    var ramdb = db.ramdb;
    var rno = ramdb.no;
    var rnor = ramdb.nor;
    var rdep = ramdb.dep;
    var rcdt = ramdb.cdt;
    var rcno = ramdb.cno;
    var roo = ramdb.oo;
    var rAsset = ramdb.asset;

    var query = {};
    if(body.area){
        var area = body.area;
        if(area.classID == uiclassID.park){
            var buildings = db.ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id, uiclassID.building);
            var mNOS = [area.serverNO];
            for(var i in buildings){
                var item = buildings[i];
                mNOS.push(item.serverNO);
            }
            query.serverNO = {$in: mNOS};
        }else if(area.classID == uiclassID.building){
            query.serverNO = area.serverNO;
        }else{
            var idList = [area.id];

            var areaList = area_helper.get_all_child(area, [uiclassID.area, uiclassID.building, uiclassID.floor, uiclassID.room]);
            if(areaList){
                for(var i in areaList){
                    idList.push(areaList[i].id);
                }
            }
            query.serverNO = area.serverNO;
            query.area = {$in: idList};
        }
    }
    if(body.source){
        query['source.serverNO'] = body.source.serverNO;
        query['source.classID'] = body.source.classID;
        query['source.id'] = body.source.id;
    }
    if(body.type != undefined){
        query.type = body.type;
    }
    var start = new Date(body.start);
    var end = new Date(body.end);
    query.startTime = {$gte: start, $lt: end};
    query.isFiltered = null;

    dbHisAlarm.find_his_alarm(query, {_id: 0}, function (err, alarms) {
        if(err) return callback({status: code.unknown, msg: err.message});
        var result = [];
        for(var i=0;i<alarms.length;i++){
            var record = alarms[i];

            var source = record.source;

            var roomID = undefined;
            var roomName = undefined;
            var _room = rnor.get_parent_identity(source.serverNO, source.classID, source.id, uiclassID.room);
            if(_room){
                var obj = rno.get_no_sync(_room.serverNO, _room.classID, _room.id);
                if(obj){
                    roomID = obj.id;
                    roomName = obj.name;
                }
            }
            var buildingID = undefined;
            var buildingName = undefined;

            var _building = undefined;
            if(_room){
                _building = rnor.get_parent_identity(_room.serverNO, _room.classID, _room.id, uiclassID.building);
            }
            if(_building){
                var obj =  rno.get_no_sync(_building.serverNO, _building.classID, _building.id);
                if(obj){
                    buildingID = obj.id;
                    buildingName = obj.name;
                }
            }
            
            var deviceName = undefined;
            var pointName = undefined;
            var model = undefined;
            var brand = undefined;
            // if(source.classID >= uiclassID.device && source.classID <= uiclassID.lastDevice){
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
            // }else{
            //     var cd = rAsset.get_asset_sync(source);
            //     if(cd){
            //         deviceName = cd.fullName;
            //         if(source.pointIndex != undefined){
            //             var point = rcdt.get_collect_device_type_point(cd.type, source.pointIndex);
            //             if(point){
            //                 pointName = point.name;
            //             }
            //         }
            //     }
            // }

            var confirmTime = undefined;
            var userName = undefined;
            var content = undefined;
            if(record.confirmed){
                confirmTime = record.confirmed.time;
                content = record.confirmed.content;
                var user = roo.get_operator_by_id(record.confirmed.user);
                if(user){
                    userName = user.fullName;
                }
            }

            var item = {
                serverNO: record.serverNO,
                classID: record.classID,
                id: record.id,
                buildingID: buildingID,
                buildingName: buildingName,
                roomID: roomID,
                roomName: roomName,
                deviceClassID: source.classID,
                deviceName: deviceName,
                model: model,
                brand: brand,
                pointName: pointName || '',
                pointValue: record.start ? record.start.pointValue : undefined,
                level: record.level,
                startTime: record.startTime,
                endTime: record.endTime,
                desc: record.desc,

                confirmTime: confirmTime,
                confirmUser: userName,
                confirmContent: content || '',
                isForce: record.isForce || 0
            };

            result.push(item);
        }

        callback(null, result);
    });
}

module.exports.cmd = cmd.alm_0x00020003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        area: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        },
        source: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        },
        type: {type: 'number'},
        start: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        end: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};