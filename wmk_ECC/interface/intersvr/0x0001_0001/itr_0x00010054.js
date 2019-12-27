/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db');
var ramdb = db.ramdb;

var uiclassID = require('../../../definition/uiClassID');

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var buildings = [];
    var _dic = {};
    var areas = body.areas;
    for(var i=0;i<areas.length;i++){
        var area = areas[i];
        switch(area.classID){
            case uiclassID.park:
                var _buildings = ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id, uiclassID.building);
                if(_buildings){
                    for(var j=0;j<_buildings.length;j++){
                        var building = _buildings[j];
                        var _key = format_key(building.serverNO, building.classID, building.id);
                        if(!_dic[_key]){
                            _dic[_key] = 1;
                            buildings.push(building);
                        }
                    }
                }
                break;
            case uiclassID.building:
                var _key = format_key(area.serverNO, area.classID, area.id);
                if(!_dic[_key]){
                    _dic[_key] = 1;
                    buildings.push(area);
                }
                break;
        }
    }

    if(buildings.length > 0){
        db.datadb.amdata.query({$or: buildings, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, day: 1, oDryTemp: 1, oWetTemp: 1, oDewTemp: 1, time: 1}, function (err, results) {
            if(err) logger.error(err);

            var response = [];

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var key = format_key(item.serverNO, item.classID, item.id);
                    if(!dic[key]){
                        dic[key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, data: {}};
                    }
                    var hour = item.time.format_hour();
                    if(!dic[key].data[hour]){
                        dic[key].data[hour] = {oDryTemp: 0, oDryTempCount: 0, oWetTemp: 0, oWetTempCount: 0, oDewTemp: 0, oDewTempCount: 0}
                    }
                    var _data = dic[key].data[hour];
                    if(item.oDryTemp){
                        _data.oDryTemp += item.oDryTemp;
                        _data.oDryTempCount++;
                    }
                    if(item.oWetTemp){
                        _data.oWetTemp += item.oWetTemp;
                        _data.oWetTempCount++;
                    }
                    if(item.oDewTemp){
                        _data.oDewTemp += item.oDewTemp;
                        _data.oDewTempCount++;
                    }
                }
            }
            for(var key in dic){
                var item = dic[key];

                item.list = [];
                for(var hour in item.data){
                    var _data = item.data[hour];

                    var oDryTemp = 0;
                    var oWetTemp = 0;
                    var oDewTemp = 0;
                    if(_data.oDryTempCount){
                        oDryTemp = _data.oDryTemp / _data.oDryTempCount;
                    }
                    if(_data.oWetTempCount){
                        oWetTemp = _data.oWetTemp / _data.oWetTempCount;
                    }
                    if(_data.oDewTempCount){
                        oDewTemp = _data.oDewTemp / _data.oDewTempCount;
                    }

                    item.list.push({hour: hour, oDryTemp: oDryTemp, oWetTemp: oWetTemp, oDewTemp: oDewTemp})
                }
                delete item.data;
            }
            for(var i=0;i<buildings.length;i++){
                var building = ramdb.no.get_by_identity(buildings[i]);
                if(building){
                    var key = format_key(building.serverNO, building.classID, building.id);
                    var data = dic[key] || {serverNO: building.serverNO, classID: building.classID, id: building.id, list: []};
                    data.name = building.fullName;
                    response.push(data);
                }
            }

            callback(null, response);
        })
    }else{
        callback()
    }
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010054;
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
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};