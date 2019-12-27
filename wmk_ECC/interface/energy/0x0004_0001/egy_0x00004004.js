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

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetDate().AddDays(-7);
    var endTime = new Date().GetDate();

    var park = ramdb.no.get_by_identity(body);
    if(!park){
        callback({status: code.not_found, msg: 'park not found'});
        return;
    }

    var response = {
        serverNO: park.serverNO,
        classID: park.classID,
        id: park.id,
        name: park.fullName,
        dayList: [],
        buildings: []
    };

    var buildings = ramdb.nor.get_child_identity(park.serverNO, park.classID, park.id, uiclassID.building);
    if(!buildings || buildings.length <= 0){
        callback(null, response);
        return;
    }
    datadb.amday.query({$or: buildings, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, id: 1, day: 1, cTemp: 1, oDryTemp: 1, oWetTemp: 1, oDewTemp: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i in results){
                var item = results[i];

                if(!dic[item.day]){
                    dic[item.day] = {};
                }
                if(!dic[item.day][item.serverNO]){
                    dic[item.day][item.serverNO] = {};
                }
                if(!dic[item.day][item.serverNO][item.id]){
                    dic[item.day][item.serverNO][item.id] = item;
                }
            }
        }

        for(var i in dic){
            response.dayList.push(i);
        }

        for(var i in buildings){
            var building = ramdb.no.get_by_identity(buildings[i]);
            if(building){
                var item = {
                    serverNO: building.serverNO,
                    classID: building.classID,
                    id: building.id,
                    name: building.fullName,
                    cTempList: [],
                    oDryTempList: [],
                    oWetTempList: [],
                    oDewTempList: [],
                };

                for(var j in dic){
                    var dayItem = dic[j];

                    var _bItem = undefined;
                    if(dayItem[building.serverNO]){
                        _bItem = dayItem[building.serverNO][building.id];
                    }
                    if(_bItem){
                        item.cTempList.push(_bItem.cTemp || 0);
                        item.oDryTempList.push(_bItem.oDryTemp || 0);
                        item.oWetTempList.push(_bItem.oWetTemp || 0);
                        item.oDewTempList.push(_bItem.oDewTemp || 0);
                    }else{
                        item.cTempList.push(0);
                        item.oDryTempList.push(0);
                        item.oWetTempList.push(0);
                        item.oDewTempList.push(0);
                    }
                }

                response.buildings.push(item);
            }
        }
        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00004004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'integer', required: true},
        classID: {type: 'integer', required: true},
        id: {type: 'integer', required: true}
    }
};