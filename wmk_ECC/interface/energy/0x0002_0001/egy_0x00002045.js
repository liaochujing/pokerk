/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var areaHelper = require('../../../helpers/area_helper');
var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetMonth().AddDays(-3);
    var endTime = new Date().GetMonth();

    var response = [];

    var rowCabinet = ramdb.no.get_by_identity(body);
    if(rowCabinet){
        var match = {serverNO: body.serverNO};
        var cabIDList = [];
        var cabList = areaHelper.get_child_identity_range(rowCabinet.serverNO, rowCabinet.classID, rowCabinet.id, uiclassID.cabinet);
        if(cabList){
            for(var i=0;i<cabList.length;i++){
                var identity = cabList[i];
                var cab = ramdb.no.get_by_identity(identity);
                if(cab){
                    cabIDList.push(cab.id);
                }
            }
            if(cabIDList.length > 0){
                match.id = {$in: cabIDList};
            }else{
                callback(null, response);
                return;
            }
        }
        match.time = {$gte: startTime, $lt: endTime};

        datadb.cmday.aggregate([
            {$match: match},
            {$group: {
                _id: '$id',
                energy: {$last: '$energy'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    dic[item._id] = item.enUsage;
                }
            }

            if(cabList){
                for(var i=0;i<cabList.length;i++){
                    var cab = ramdb.no.get_by_identity(cabList[i]);
                    if(cab){
                        var cacheItem = realTimeProcessor.get_device_data_cache(cab);
                        if(cacheItem){
                            var value = dic[cab.id];
                            response.push({
                                serverNO: cab.serverNO,
                                classID: cab.classID,
                                id: cab.id,
                                name: cab.fullName,
                                value:  format_value((cacheItem.energy || 0) - (value || 0))
                            })
                        }else{
                            response.push({
                                serverNO: cab.serverNO,
                                classID: cab.classID,
                                id: cab.id,
                                name: cab.fullName,
                                value: 0
                            })
                        }
                    }
                }
            }

            callback(null, response);
        })
    }else{
        callback(null, response);
    }
}

module.exports.cmd = cmd.cmd_0x00002045;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number'},
        classID: {type: 'number'},
        id: {type: 'number', required: true}
    }
};