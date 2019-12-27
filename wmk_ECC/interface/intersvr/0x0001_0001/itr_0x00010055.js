/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db');
var ramdb = db.ramdb;

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
        db.datadb.amday.query({$or: buildings, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, day: 1, oDryTemp: 1, oWetTemp: 1, oDewTemp: 1}, function (err, results) {
            if(err) logger.error(err);

            var response = [];

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var key = format_key(item.serverNO, item.classID, item.id);
                    if(!dic[key]){
                        dic[key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []};
                    }
                    dic[key].list.push({day: item.day, oDryTemp: item.oDryTemp || 0, oWetTemp: item.oWetTemp || 0, oDewTemp: item.oDewTemp || 0})
                }
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
module.exports.cmd = cmd.itr_0x00010055;
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
            }
        },
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};