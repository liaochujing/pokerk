/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var devices = [];
    for(var i=0;i<body.devices.length;i++){
        var item = body.devices[i];
        var device = ramdb.no.get_by_identity(item);
        if(device){
            devices.push(device);
        }
    }

    var response = [];
    ah.each_series(devices, function (device, cbItem) {
        var building = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.building));
        var room = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(device.serverNO, device.classID, device.id, uiclassID.room));
        var item = {
            building: building ? building.fullName : '',
            room: room ? room.fullName : '',
            name: device.fullName,
            ratedPower: device.ratedPower,
            data: []
        };
        response.push(item);

        var ratedPower = device.ratedPower || 0;
        db.datadb.dmdata.query({serverNO: device.serverNO, classID: device.classID, id: device.id, time: {$gt: startTime, $lt: endTime}}, {_id: 0, power: 1, time: 1}, function (err, results) {
            if(err) logger.error(err);

            if(results){
                for(var i=0;i<results.length;i++){
                    var record = results[i];
                    var load = 0;
                    var power = format_value(record.power|| 0);
                    if(ratedPower){
                        load = format_value(power / ratedPower);
                    }
                    item.data.push({
                        power: power,
                        load: load
                    })
                }
            }
            item.data = results;

            cbItem();
        });
    }, function () {
        callback(null, response);
    });
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010023;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        devices: {
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
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};