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
    var limit = body.limit || 15;
    var response = [];

    var startTime = undefined;
    var endTime = undefined;

    switch (body.type){
        case 'day':
            startTime = new Date().GetDate().AddDays(-1);
            endTime = new Date().GetDate();
            break;
        case 'week':
            startTime = new Date().GetDate().AddDays(-7);
            endTime = new Date().GetDate();
            break;
        case 'month':
            startTime = new Date().GetDate().AddMonth(-1);
            endTime = new Date().GetDate();
            break;
        case 'self':
            startTime = new Date(body.startTime);
            endTime = new Date(body.endTime);
            break;
    }

    var _match = {time: {$gte: startTime, $lt: endTime}};
    if(body.classID == uiclassID.park){
        var buildings = db.ramdb.nor.get_child_identity(body.serverNO, body.classID, body.id, uiclassID.building);
        var mNOS = [body.serverNO];
        for(var i in buildings){
            var item = buildings[i];
            mNOS.push(item.serverNO);
        }
        _match.serverNO = {$in: mNOS};
    }else if(body.classID == uiclassID.building){
        _match.serverNO = body.serverNO;
    }else{
        var rooms = areaHelper.get_child_identity(body.serverNO, body.classID, body.id, uiclassID.room);
        _match['$or'] = rooms;
    }
    datadb.cmday.aggregate([
        {$match: _match},
        {$group: {
            _id: {
                serverNO: '$serverNO',
                classID: '$classID',
                id: '$id'
            },
            enUsage: {$sum: '$enUsage'}
        }},
        {$sort: {enUsage: -1}},
        {$limit: limit}
    ], function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];

                var room = ramdb.no.get_by_identity(item._id);
                response.push({
                    serverNO: item._id.serverNO,
                    classID: item._id.classID,
                    id: item._id.id,
                    name: room ? room.fullName : '未知',
                    enUsage: format_value(item.enUsage)
                })
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00003020;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        type: {type: 'string', enum: ['day', 'week', 'month', 'self'], required: true},
        startTime: {type: 'string'},
        endTime: {type: 'string'},
        limit: {type: 'integer'}
    }
};