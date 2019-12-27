/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var EnergySystem = require('../../../modules/energy/definition/energy_system');

var areaHelper = require('../../../helpers/area_helper');
var deviceHelper = require('../../../helpers/device_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var group = body.group;

    var deviceList = [];
    var identityList = [];
    var _deviceList = areaHelper.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.device, uiclassID.lastDevice);
    for(var i in _deviceList){
        var device = ramdb.no.get_by_identity(_deviceList[i]);
        var _config = deviceHelper.get_device_type_config(device);
        if(_config && _config.esType){
            var esType = _config.esType;
            if(esType.system == EnergySystem.cold && esType.group == group){
                identityList.push({serverNO: device.serverNO, id: device.id});
                deviceList.push(device);
            }
        }
    }

    var response = {
        dayList: [],
        deviceList: []
    };
    if(identityList.length <= 0){
        callback(null, response);
        return;
    }

    var startTime = new Date().GetDate().AddDays(-30);
    var endTime = new Date().GetDate();

    datadb.dmday.query({time: {$gte: startTime, $lt: endTime}, $or: identityList}, {serverNO: 1, id: 1, day: 1, enUsage: 1}, function (err, results) {
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
                dic[item.day][item.serverNO][item.id] = item.enUsage;
            }
        }

        for(var i in dic){
            response.dayList.push(i);
        }

        for(var i in deviceList){
            var device = deviceList[i];

            var deviceItem = {
                name: device.fullName,
                data: []
            };

            for(var j in dic){
                var dayItem = dic[j];
                var value = 0;
                if(dayItem[device.serverNO]){
                    value = dayItem[device.serverNO][device.id]
                }
                deviceItem.data.push(value || 0)
            }

            response.deviceList.push(deviceItem)
        }

        callback(null, response)
    })
}

module.exports.cmd = cmd.cmd_0x0000102A;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        group: {type: 'number', required: true}
    }
};