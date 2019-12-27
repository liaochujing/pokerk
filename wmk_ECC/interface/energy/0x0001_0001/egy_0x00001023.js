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

var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetDate().AddDays(-30);
    var endTime = new Date().GetDate();

    var response = {
        dayList: [],
        rowCabinetList: []
    };

    var match = {serverNO: body.serverNO};
    if(body.classID != uiclassID.building){
        var roomIDList = [];
        var roomList = areaHelper.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.room);
        if(roomList){
            for(var i=0;i<roomList.length;i++){
                var identity = roomList[i];
                var room = ramdb.no.get_by_identity(identity);
                if(room){
                    roomIDList.push(room.id)
                }
            }
        }
        if(roomIDList.length > 0){
            match.areaID = {$in: roomIDList};
        }else{
            callback(null, response);
            return;
        }
    }
    match.time = {$gte: startTime, $lt: endTime};

    // var match = {serverNO: body.serverNO};
    // if(body.classID != uiclassID.building){
    //     var cabIDList = [];
    //     var cabList = areaHelper.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.cabinet);
    //     if(cabList){
    //         for(var i=0;i<cabList.length;i++){
    //             var identity = cabList[i];
    //             var cab = ramdb.no.get_by_identity(identity);
    //             if(cab){
    //                 cabIDList.push(cab.id);
    //             }
    //         }
    //     }
    //     if(cabIDList.length > 0){
    //         match.id = {$in: cabIDList};
    //     }else{
    //         callback(null, response);
    //         return;
    //     }
    // }
    // match.time = {$gte: startTime, $lt: endTime};

    datadb.cmday.query(match, {_id: 0, day: 1, serverNO: 1, id: 1, enUsage: 1}, function (err, results) {
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

        for(var day in dic){
            response.dayList.push(day)
        }

        var rowCabinetList = areaHelper.get_child_identity(body.serverNO, body.classID, body.id, uiclassID.rowCabinet);
        for(var i in rowCabinetList){
            var rowCabinet = rowCabinetList[i];

            var _dic = {};
            var childs = ramdb.nor.get_child_identity_range(rowCabinet.serverNO, rowCabinet.classID, rowCabinet.id, uiclassID.cabinet);
            if(childs){
                for(var j=0;j<childs.length;j++){
                    _dic[childs[j].id] = 1;
                }
            }

            var rowCabItem = {
                name: rowCabinet.fullName,
                data: []
            };


            for(var j in dic){
                var enUsage = 0;
                if(dic[j][rowCabinet.serverNO]){
                    var cabItemDic = dic[j][rowCabinet.serverNO];
                    for(var k in cabItemDic){
                        if(_dic[k]){
                            enUsage+=(cabItemDic[k] || 0);
                        }
                    }
                }
                rowCabItem.data.push(enUsage);
            }

            response.rowCabinetList.push(rowCabItem)
        }

        callback(null, response);
    });
    

}

module.exports.cmd = cmd.cmd_0x00001023;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};