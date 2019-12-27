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

var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');
var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var now = new Date();

    var match = {serverNO: body.serverNO, classID: body.classID, id: body.id};
    var startTime = now.AddHours(-1);
    var endTime = now;
    match.time = {$gte: startTime, $lt: endTime};

    datadb.rmdata.aggregate([
        {$match: match},
        {$group: {
            _id: '',
            cTemp: {$last: '$cTemp'},
            maxCTemp: {$max: '$maxCTemp'},
            minCTemp: {$min: '$maxCTemp'},
            hTemp: {$last: '$hTemp'},
            maxHTemp: {$max: '$maxHTemp'},
            minHTemp: {$min: '$maxHTemp'}
        }},
        {$sort: {time: 1}}
    ], function (err, results) {
        if(err) logger.error(err);

        var response = {
            cTemp: 0,
            maxCTemp: 0,
            minCTemp: 0,
            hTemp: 0,
            maxHTemp: 0,
            minHTemp: 0
        };
        if(results && results.length > 0){
            var record = results[0];
            response.cTemp = record.cTemp;
            response.maxCTemp = record.maxCTemp;
            response.minCTemp = record.minCTemp;
            response.hTemp = record.hTemp;
            response.maxHTemp = record.maxHTemp;
            response.minHTemp = record.minHTemp;
        }
        var data = realTimeProcessor.get_area_data_cache(body);
        if(data){
            if(data){
                if(data.cTemp){
                    response.cTemp = data.cTemp;
                    if(response.cTemp > response.maxCTemp){
                        response.maxCTemp = response.cTemp;
                    }
                    if(response.cTemp < response.minCTemp){
                        response.minCTemp = response.cTemp;
                    }
                }
                if(data.hTemp){
                    response.hTemp = data.hTemp;
                    if(response.hTemp > response.maxHTemp){
                        response.maxHTemp = response.hTemp;
                    }
                    if(response.hTemp < response.minHTemp){
                        response.minHTemp = response.hTemp;
                    }
                }
            }
        }

        callback(null, response)
    });
}

module.exports.cmd = cmd.cmd_0x00004024;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};