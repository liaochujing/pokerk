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
    var response = {
        dayList: [],
        hvdcList: []
    };

    var startTime = new Date().GetDate().AddDays(-30);
    var endTime = new Date().GetDate();

    var idList = [];
    var hvdcList = areaHelper.get_child_identity_list(body.serverNO, body.classID, body.id, uiclassID.HVDC_List);
    if(hvdcList){
        for(var i=0;i<hvdcList.length;i++){
            var hvdc = hvdcList[i];
            idList.push({serverNO: hvdc.serverNO, classID: hvdc.classID, id: hvdc.id});
        }
    }

    if(idList.length <= 0){
        callback(null, response);
        return;
    }

    datadb.dmday.query({time: {$gte: startTime, $lt: endTime}, $or: idList}, {serverNO: 1, id: 1, day: 1, out_power: 1}, function (err, results) {
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
                dic[item.day][item.serverNO][item.id] = item.out_power;
            }
        }

        for(var i in dic){
            response.dayList.push(i);
        }

        for(var i in hvdcList){
            var hvdc = ramdb.no.get_by_identity(hvdcList[i]);
            if(hvdc){
                var hvdcItem = {
                    serverNO: hvdc.serverNO,
                    classID: hvdc.classID,
                    id: hvdc.id,
                    name: hvdc.fullName,
                    data: []
                };
                for(var j in dic){
                    var out_power = 0;
                    var dayItem = dic[j];
                    if(dayItem[hvdc.serverNO]){
                        out_power = dayItem[hvdc.serverNO][hvdc.id] || 0;
                    }
                    hvdcItem.data.push(out_power);
                }
                response.hvdcList.push(hvdcItem)
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00001044;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};