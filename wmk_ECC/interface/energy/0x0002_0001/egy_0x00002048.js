/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');
var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetMonth().AddDays(-3);
    var endTime = new Date().GetMonth();

    var response = [];

    var objIDList = [];
    var objList = areaHelper.get_child_object_list(body, uiclassID.AC_List);
    for(var i=0;i<objList.length;i++){
        var obj = objList[i];
        objIDList.push({serverNO: obj.serverNO, classID: obj.classID, id: obj.id});
    }

    if(objIDList.length <= 0){
        callback(null, response);
        return;
    }

    datadb.dmday.aggregate([
        {$match: {time: {$gte: startTime, $lt: endTime}, $or: objIDList}},
        {$group: {
            _id: {
                serverNO: '$serverNO',
                classID: '$classID',
                id: '$id'
            },
            energy: {$last: '$energy'}
        }}
    ], function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var serverNO = item._id.serverNO;
                var id = item._id.id;
                if(!dic[serverNO]){
                    dic[serverNO] = {};
                }
                dic[serverNO][id] = item.energy || 0;
            }
        }

        for(var i=0;i<objList.length;i++){
            var obj = objList[i];

            var cacheItem = realTimeProcessor.get_device_data_cache(obj);
            if(cacheItem){
                var value = 0;
                if(dic[obj.serverNO]){
                    value = dic[obj.serverNO][obj.id];
                }

                response.push({
                    serverNO: obj.serverNO,
                    classID: obj.classID,
                    id: obj.id,
                    name: obj.fullName,
                    value:  format_value((cacheItem.energy || 0) - (value || 0))
                })
            }else{
                response.push({
                    serverNO: obj.serverNO,
                    classID: obj.classID,
                    id: obj.id,
                    name: obj.fullName,
                    value: 0
                })
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00002048;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};