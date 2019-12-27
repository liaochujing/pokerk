/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

module.exports.privilege = PrivilegePoint.queryReport;
function handle(req, res, body, callback) {
    var ramdb = db.ramdb;
    var rno = ramdb.no;
    var rnor = ramdb.nor;
    var rdep = ramdb.dep;
    var rAsset = ramdb.asset;

    var query = {};

    if(body.points){
        var _points = [];
        for(var i=0;i<body.points.length;i++){
            var point = body.points[i];
            _points.push({'source.serverNO': point.serverNO, 'source.classID': point.classID, 'source.id': point.id, 'source.pointIndex': point.pointIndex})
        }
        query['$or'] = _points;
    }
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);
    query.startTime = {$gte: startTime, $lt: endTime};

    db.datadb.hisalarm.find_his_alarm(query, {_id: 0}, function (err, alarms) {
        if(err) return callback({status: code.unknown, msg: err.message});
        var result = [];
        for(var i=0;i<alarms.length;i++){
            var record = alarms[i];

            var source = record.source;

            var roomID = undefined;
            var roomName = undefined;
            var _room = rnor.get_parent_identity(source.serverNO, source.classID, source.id, uiclassID.room);
            if(_room){
                var obj = rno.get_by_identity(_room);
                if(obj){
                    roomID = obj.id;
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
                endTime: record.endTime,
                desc: record.desc
            };

            result.push(item);
        }

        callback(null, result);
    });
}

module.exports.cmd = cmd.itr_0x00010005;
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
        startTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        endTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};