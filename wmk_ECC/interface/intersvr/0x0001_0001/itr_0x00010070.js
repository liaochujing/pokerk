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

    var threshold = body.threshold;

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
        db.datadb.cmdata.query({$or: areas, time: {$gte: startTime, $lt: endTime}, power: {$gte: threshold}}, {_id: 0, serverNO: 1, classID: 1, id: 1, time: 1}, {time: 1}, function (err, results) {
            if(err) logger.error(err);

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var key = format_key(item.serverNO, item.classID, item.id);
                    if(!dic[key]){
                        dic[key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []};
                    }
                    dic[key].list.push(item.time);
                }
            }

            var response = [];

            var max_interval = 8 * 60 * 1000;

            for(var k in dic){

                var cabItem = dic[k];

                var resList = [];
                var _start = startTime;
                var _pre = startTime;
                for(var i=0;i<cabItem.list.length;i++){
                    var _time = cabItem.list[i];

                    if(_start == undefined){
                        _start = _time;
                    }else{
                        var interval = _time - _pre;
                        if(interval > max_interval){
                            if(_start != _pre){
                                resList.push({start: _start, end: _pre});
                            }
                            _start = undefined;
                        }
                    }
                    _pre = _time;
                }
                if(_start != undefined){
                    resList.push({start: _start, end: endTime});
                }
                cabItem.list = resList;

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
module.exports.cmd = cmd.itr_0x00010070;
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
        threshold: {type: 'number', required: true},
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};