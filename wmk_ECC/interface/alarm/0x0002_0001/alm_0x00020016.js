/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var area_helper = require('../../../helpers/area_helper');

var db = require('../../../db');
var rdbNO = db.ramdb.no;

function handle(req, res, body, callback) {

    var dbAlarm = db.alarm;
    var option = [];
    //需要获取的告警数量对象的区域classID
    var area_classIDs = body.area_classIDs;

    var query = {isConfirmed: null, isForce: null, isHangup: {$ne: 1}, isFiltered: null};
    var area = body;

    if(area_classIDs && area_classIDs.length > 0){
        if(area.classID == uiclassID.park){
            var buildings = db.ramdb.nor.get_child_identity(area.serverNO, area.classID, area.id, uiclassID.building);
            var mNOS = [area.serverNO];
            for(var i in buildings){
                var item = buildings[i];
                mNOS.push(item.serverNO);
            }
            query.serverNO = {$in: mNOS};

            // var idList = [];
            // var areaList = db.ramdb.nor.get_child_identity_list(area.serverNO, area.classID, area.id, area_classIDs);
            // if(areaList){
            //     for(let j=0;j<areaList.length;j++){
            //         let temps = areaList[j];
            //         idList.push(temps.id);

            //         var areaList2 = area_helper.get_all_child(temps, [uiclassID.building, uiclassID.floor, uiclassID.room, uiclassID.area]);
            //         if(areaList2){
            //             for(var i in areaList2){
            //                 idList.push(areaList2[i].id);
            //             }
            //         }
            //     }
            // }
            // query.area = {$in: idList};

        }else {
            query.serverNO = area.serverNO;
            var idList = [];

            for(let i=0;i<area_classIDs.length;i++){
                let item = area_classIDs[i];
                if(area.classID == item){
                    idList.push(area.id);
                    break;
                }
            }
    
            var areaList = db.ramdb.nor.get_child_identity_list(area.serverNO, area.classID, area.id, area_classIDs);
            if(areaList){
                for(var i in areaList){
                    idList.push(areaList[i].id);
                }
            }
            query.area = {$in: idList};
        }
    }else{
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
    
            var areaList = area_helper.get_all_child(area, [uiclassID.building, uiclassID.floor, uiclassID.room, uiclassID.area]);
            if(areaList){
                for(var i in areaList){
                    idList.push(areaList[i].id);
                }
            }
            query.serverNO = area.serverNO;
            query.area = {$in: idList};
        }
    }

    option.push({$match: query});
    option.push({$group: {
        _id: '$level',
        count: {$sum: 1}
    }});

    dbAlarm.aggregate(option, function (err, results) {
        if(err) logger.error(err);

        var response = [];
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var level = item._id;
                var count = item.count;

                response.push({level: level, count: count})
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.alm_0x00020016;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        area_classIDs: {type: 'array', items: {type: 'number'}}
    }
};