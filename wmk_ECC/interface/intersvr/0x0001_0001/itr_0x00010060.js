/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var areaHelper = require('../../../helpers/area_helper');
var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    if(endTime - startTime > 24 * 60 * 60 * 1000){
        callback({status: code.unknown, msg: '时间范围错误'});
        return;
    }

    var areas = [];
    for(var i=0;i<body.areas.length;i++){
        var area = body.areas[i];
        if(area.classID == uiclassID.cabinet) {
            areas.push(area);
        }else if(area.classID == uiclassID.rowCabinet){
            var cabinets = areaHelper.get_child_identity_range(area.serverNO, area.classID, area.id, uiclassID.cabinet);
            if(cabinets){
                areas = areas.concat(cabinets);
            }
        }else if(area.classID == uiclassID.room){
            areas.push({serverNO: area.serverNO, areaID: area.id});
        }else{
            var _rooms = areaHelper.get_data_room(area);
            if(_rooms){
                for(var j=0;j<_rooms.length;j++){
                    var room = _rooms[j];
                    areas.push({serverNO: room.serverNO, areaID: room.id})
                }
            }
        }
    }

    if(areas.length > 0){
        db.datadb.cmdata.query({$or: areas, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, energy: 1, time: 1}, {time: 1}, function (err, results) {
            if(err) logger.error(err);

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var key = format_key(item.serverNO, item.classID, item.id);
                    if(!dic[key]){
                        dic[key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []};
                    }
                    dic[key].list.push({energy: item.energy, time: item.time});
                }
            }

            var response = [];

            for(var k in dic){
                var cabItem = dic[k];

                var _list = cabItem.list;
                if(_list) {
                    var _dic = {};
                    for (var j = 0; j < _list.length; j++) {
                        var _item = _list[j];

                        var _time = new Date(_item.time);
                        var hour = _time.getHours();
                        var minute = _time.getMinutes();
                        var second = _time.getSeconds();

                        var interval = minute * 60 + second;
                        if (minute >= 30) {
                            hour++;
                            interval = 60 * 60 - minute * 60 - second;
                        }
                        if (!_dic[hour]) {
                            _dic[hour] = {interval: interval, energy: _item.energy};
                        } else {
                            if (_dic[hour].interval > interval) {
                                _dic[hour] = {interval: interval, energy: _item.energy};
                            }
                        }
                    }

                    var resList = [];
                    var _preValue = undefined;
                    for (var j = 0; j < 24; j++) {
                        var v1 = _preValue;
                        var v2 = undefined;
                        if (_dic[j]) {
                            v1 = _dic[j].energy;
                        }
                        if (_dic[j + 1]) {
                            v2 = _dic[j + 1].energy;
                        }

                        _preValue = v1;
                        if (v1 != undefined && v2 != undefined) {
                            resList.push({hour: j, energy: format_value(v2 - v1)});
                        } else {
                            resList.push({hour: j, energy: 0})
                        }
                    }
                    cabItem.list = resList;
                }

                var cabinet = ramdb.no.get_by_identity(cabItem);
                if(cabinet){
                    cabItem.name = cabinet.fullName;
                }
                var room = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(cabItem.serverNO, cabItem.classID, cabItem.id, uiclassID.room));
                if(room){
                    cabItem.room = room.fullName;
                }
                var building = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(cabItem.serverNO, cabItem.classID, cabItem.id, uiclassID.building));
                if(building){
                    cabItem.building = building.fullName;
                }

                response.push(cabItem);
            }

            callback(null, response)
        })
    }else{
        callback();
    }
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010060;
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