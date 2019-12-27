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
var areaHelper = require('../../../helpers/area_helper');
var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    var _dic = {};
    var cabinets = [];
    for(var i=0;i<body.areas.length;i++){
        var item = body.areas[i];
        switch (item.classID){
            case uiclassID.rowCabinet:
                var _childs = ramdb.nor.get_child_identity(item.serverNO, item.classID, item.id, uiclassID.cabinet);
                if(_childs){
                    for(var j=0;j<_childs.length;j++){
                        var _item = _childs[j];
                        if(_dic[_item.id]){
                            continue
                        }
                        _dic[_item.id] = 1;
                        cabinets.push({serverNO: _item.serverNO, classID: _item.classID, id: _item.id});
                    }
                }
                break;
            case uiclassID.cabinet:
                if(_dic[item.id]){
                    break
                }
                _dic[item.id] = 1;
                cabinets.push({serverNO: item.serverNO, classID: item.classID, id: item.id});
                break;
        }
    }

    db.datadb.cmdata.query({$or: cabinets, time: {$gt: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, power: 1, time: 1}, function (err, results) {
        if(err) logger.error(err);

        var _dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var key = format_key(item.serverNO, item.classID, item.id);
                if(!_dic[key]){
                    _dic[key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []}
                }
                _dic[key].list.push({power: item.power, time: item.time})
            }
        }

        var response = [];
        for(var i in _dic){
            var cabinetItem = _dic[i];

            var cabinet = ramdb.no.get_by_identity(cabinetItem);
            if(cabinet){
                var building = undefined;
                var room = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(cabinetItem.serverNO, cabinetItem.classID, cabinetItem.id, uiclassID.room));
                if(room){
                    building = ramdb.no.get_by_identity(ramdb.nor.get_parent_identity(room.serverNO, room.classID, room.id, uiclassID.building));
                }

                cabinetItem.building = building ? building.fullName : '';
                cabinetItem.room = room ? room.fullName : '';
                cabinetItem.name = cabinet.fullName;
                cabinetItem.ratedPower = cabinet.ratedPower;

                response.push(cabinetItem);
            }
        }

        callback(null, response);
    });
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010022;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areas: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            },
            required: true
        },
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};