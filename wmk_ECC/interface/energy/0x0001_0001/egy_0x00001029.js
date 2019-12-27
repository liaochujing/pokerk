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
var ColdSystem = require('../../../modules/energy/definition/cold_system');
var DefinitionHelper = require('../../../modules/energy/definition/definition_helper');

var areaHelper = require('../../../helpers/area_helper');
var deviceHelper = require('../../../helpers/device_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var deviceIDDic = {};
    var deviceGroupList = [];
    var deviceList = areaHelper.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.device, uiclassID.lastDevice);
    for(var i in deviceList){
        var device = ramdb.no.get_by_identity(deviceList[i]);
        var _config = deviceHelper.get_device_type_config(device);
        if(_config && _config.esType){
            var esType = _config.esType;
            if(esType.system == EnergySystem.cold){
                if(!deviceIDDic[esType.group]){
                    deviceIDDic[esType.group] = [];
                    deviceGroupList.push({group: esType.group, list: deviceIDDic[esType.group]});
                }
                deviceIDDic[esType.group].push({serverNO: device.serverNO, id: device.id});
            }
        }
    }

    var _type = body.type;
    
    var endTime = undefined;
    var startTime = undefined;

    if(_type == 'month'){
        endTime = new Date().GetDate();
        startTime = new Date().GetDate().AddMonth(-1);
    }else if(_type == 'week'){
        endTime = new Date().GetDate();
        startTime = new Date().GetDate().AddDays(-7);
    }else{
        endTime = new Date().GetDate();
        startTime = new Date().GetDate().AddDays(-1);
    }

    var response = [];

    var resultDic = {};
    ah.each_series(deviceGroupList, function (groupItem, cbItem) {
        query_data(startTime, endTime, groupItem.list, function (data) {
            var dataList = [];
            if(data){
                for(var i in data){
                    var item = data[i];
                    var device = ramdb.no.get_by_identity(item._id);
                    dataList.push({
                        name: device ? device.fullName : '未知设备',
                        value: format_value(item.enUsage)
                    })
                }
            }
            resultDic[groupItem.group] = dataList;
            cbItem();
        })
    }, function () {
        for(var i in ColdSystem){
            var group = ColdSystem[i];

            response.push({
                name: DefinitionHelper.get_cold_system_name(group),
                data: resultDic[group] || []
            })
        }

        callback(null, response);
    });
}

function query_data(startTime, endTime, deviceList, callback) {
    datadb.dmday.aggregate([
        {$match: {time: {$gte: startTime, $lt: endTime}, $or: deviceList}},
        {$group: {
            _id: {
                serverNO: '$serverNO',
                classID: '$classID',
                id: '$id'
            },
            enUsage: {$sum: '$enUsage'}
        }},
        {$sort: {enUsage: -1}},
        {$limit: 3}
    ], function (err, results) {
        if(err) logger.error(err);
        callback(results);
    });
}


module.exports.cmd = cmd.cmd_0x00001029;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {        
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        type: {type: 'string', enum: ['day', 'week', 'month']}
    }
};