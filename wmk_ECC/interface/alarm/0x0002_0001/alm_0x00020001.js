/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;

var uiclassID = require('../../../definition/uiClassID');
var AlarmType = require('../../../definition/alarm_type');
var area_helper = require('../../../helpers/area_helper');
var db = require('../../../db');

function handle(req, res, body, callback) {

    var dbAlarm = db.alarm;

    var option = [];

    var query = {isConfirmed: null, isForce: null, isHangup: {$ne: 1}, isFiltered: null};
    var area = body;
    if(area.classID == uiclassID.park){
        var buildings = db.ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id, uiclassID.building);
        var mNOS = [area.serverNO];
        for(var i in buildings){
            var item = buildings[i];
            mNOS.push(item.serverNO);
        }
        query.serverNO = {$in: mNOS};
    }else if(area.classID == uiclassID.building){
        query.serverNO = area.serverNO;
    }else{
        var idList = [area.id];

        var areaList = area_helper.get_all_child(area, [uiclassID.area, uiclassID.building, uiclassID.floor, uiclassID.room]);
        if(areaList){
            for(var i in areaList){
                idList.push(areaList[i].id);
            }
        }
        query.serverNO = area.serverNO;
        query.area = {$in: idList};
    }

    option.push({$match: query});
    option.push({$group: {
        _id: '$type',
        count: {$sum: 1}
    }});

    dbAlarm.aggregate(option, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i in results){
                var item = results[i];
                dic[item._id] = item.count;
            }
        }

        var response = [];
        for(var i in AlarmType){
            var type = AlarmType[i];

            response.push({type: type, count: dic[type] || 0});
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.alm_0x00020001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};