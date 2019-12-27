/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;

var db = require('../../../db');

function handle(req, res, body, callback) {
    var dbAlarm = db.alarm;

    var query = {};

    var _devices = [];
    for(var i=0;i<body.devices.length;i++){
        var _d = body.devices[i];
        _devices.push({'source.serverNO': _d.serverNO, 'source.classID': _d.classID, 'source.id': _d.id});
    }
    query['$or'] = _devices;
    query.isEnd = null;         //未结束
    query.isFiltered = null;    //未收敛

    var option = [];
    option.push({$match: query});
    option.push({$group: {
        _id: {
            serverNO: '$source.serverNO',
            classID: '$source.classID',
            id: '$source.id'
        },
        count: {$sum: 1}
    }});

    dbAlarm.aggregate(option, function (err, results) {
        if(err) logger.error(err);

        var response = [];
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                response.push({serverNO: item._id.serverNO, classID: item._id.classID, id: item._id.id, count: item.count});
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.alm_0x00020010;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        devices: {
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
        }
    }
};