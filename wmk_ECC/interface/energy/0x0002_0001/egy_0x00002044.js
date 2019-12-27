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

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetDate().AddDays(-1);
    var endTime = new Date().GetDate();

    var response = [];
    
    var rowCabinet = ramdb.no.get_by_identity(body);
    if(rowCabinet){
        var match = {serverNO: body.serverNO};
        var cabIDList = [];
        var cabList = areaHelper.get_child_identity_range(rowCabinet.serverNO, rowCabinet.classID, rowCabinet.id, uiclassID.cabinet);
        if(cabList){
            for(var i=0;i<cabIDList.length;i++){
                var identity = cabList[i];
                var cab = ramdb.no.get_by_identity(identity);
                if(cab){
                    cabIDList.push(cab.id);
                }
            }
            if(cabIDList.length > 0){
                cabIDList.id = {$in: cabIDList};
            }else{
                callback(null, response);
                return;
            }
        }
        match.time = {$gte: startTime, $lt: endTime};

        datadb.cmday.query(match, {id: 1, enUsage: 1}, function (err, results) {
            if(err) logger.error(err);

            var dic = {};
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    dic[item.id] = item.enUsage || 0;
                }
            }

            for(var i in cabIDList){
                var id = cabIDList[i];
                var cab = ramdb.no.get_no_sync(body.serverNO, uiclassID.cabinet, id);
                response.push({
                    serverNO: cab.serverNO,
                    classID: cab.classID,
                    id: cab.id,
                    name: cab.fullName,
                    value: dic[cab.id] || 0
                })
            }

            callback(null, response);
        })
    }else{
        callback(null, response);
    }
}

module.exports.cmd = cmd.cmd_0x00002044;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};