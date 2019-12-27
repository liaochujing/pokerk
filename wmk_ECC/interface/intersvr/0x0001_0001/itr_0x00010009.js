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

    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var query = {};

    var _and = [];
    var _sources = [];
    for(var i=0;i<body.sources.length;i++) {
        var source = body.sources[i];
        _sources.push({'source.serverNO': source.serverNO, 'source.classID': source.classID, 'source.id': source.id});
    }
    _and.push({$or: _sources});
    _and.push({$or: [{startTime: {$gte: startTime, $lte: endTime}}, {endTime: {$gte: startTime, $lte: endTime}}]});
    query['$and'] = _and;
    if(body.alarmClassID != undefined && body.alarmClassID.length > 0){
        query.classID = {$in: body.alarmClassID};
    }
    query.isEnd = 1;

    var response = [];

    var get_alarm = function (done) {
        db.alarm.find_alarm(query, {_id: 0}, function (err, alarms) {
            if(err) return done(err);

            response = response.concat(alarms);

            done();
        });
    };

    var get_his_alarm = function (done) {
        db.datadb.hisalarm.find_his_alarm(query, {_id: 0}, function (err, alarms) {
            if(err) return done(err);

            response = response.concat(alarms);

            done();
        });
    };

    get_alarm(function (err) {
        if(err) return callback(err);
        get_his_alarm(function (err) {
            if(err) return callback(err);

            var result = [];
            for(var i=0;i<response.length;i++){
                var record = response[i];

                var source = record.source;

                var deviceName = undefined;
                var pointName = undefined;
                var device = rno.get_no_sync(source.serverNO, source.classID, source.id);
                if(device){
                    deviceName = device.fullName;
                    if(source.pointIndex != undefined){
                        var point = rdep.get_device_type_point(device.type, source.pointIndex);
                        if(point){
                            pointName = point.name;
                        }
                    }
                }

                var item = {
                    serverNO: record.serverNO,
                    classID: record.classID,
                    id: record.id,
                    source: record.source,
                    device: deviceName,
                    point: pointName || '',
                    startTime: record.startTime,
                    endTime: record.endTime,
                    desc: record.desc
                };

                result.push(item);
            }

            callback(null, result);
        })
    })
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010009;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        sources: {
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
        alarmClassID: {
            type: 'array',
            items: {type: 'number'},
            required: true
        },
        startTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        endTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};