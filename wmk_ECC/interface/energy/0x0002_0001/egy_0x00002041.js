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
    var startTime = new Date().GetDate().AddMonth(-1);
    var endTime = new Date().GetDate();

    var response = [];

    var match = undefined;
    switch(body.classID){
        case uiclassID.park:
            match = {};
            break;
        case uiclassID.building:
            match = {serverNO: body.serverNO};
            break;
        case uiclassID.floor:
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
            break;
        case uiclassID.room:
            match = {serverNO: body.serverNO, areaID: body.id};
            break;
        default:
            callback({status: code.other});
            return;
            break;
    }
    match.time = {$gte: startTime, $lt: endTime};

    datadb.cmday.aggregate([
        {$match: match},
        {$group: {
            _id: {
                serverNO: '$serverNO',
                classID: '$classID',
                id: '$id'
            },
            enUsage: {$sum: '$enUsage'}
        }},
        {$sort: {
            enUsage: -1
        }},
        {$limit: 15}
    ], function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var cab = ramdb.no.get_by_identity(item._id);
                if(cab){
                    response.push({
                        serverNO: cab.serverNO,
                        classID: cab.classID,
                        id: cab.id,
                        name: cab.fullName,
                        value: format_value(item.enUsage)
                    })
                }
            }
        }

        callback(null, response);
    })

}

module.exports.cmd = cmd.cmd_0x00002041;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};