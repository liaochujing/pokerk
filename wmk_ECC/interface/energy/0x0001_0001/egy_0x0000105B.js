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
        monthList: [],
        upsList: []
    };

    var startTime = new Date().GetMonth().AddMonth(-12);
    var endTime = new Date().GetMonth();

    var idList = [];
    var upsList = areaHelper.get_child_identity_list(body.serverNO, body.classID, body.id, uiclassID.UPS_List);
    if(upsList){
        for(var i=0;i<upsList.length;i++){
            var ups = upsList[i];
            idList.push({serverNO: ups.serverNO, classID: ups.classID, id: ups.id});
        }
    }

    if(idList.length <= 0){
        callback(null, response);
        return;
    }

    datadb.dmmon.query({time: {$gte: startTime, $lt: endTime}, $or: idList}, {serverNO: 1, id: 1, month: 1, enUsage: 1}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                if(!dic[item.month]){
                    dic[item.month] = {};
                }
                if(!dic[item.month][item.serverNO]){
                    dic[item.month][item.serverNO] = {};
                }

                dic[item.month][item.serverNO][item.id] = item.enUsage;
            }
        }

        for(var i in dic){
            response.monthList.push(i);
        }

        for(var i in upsList){
            var ups = ramdb.no.get_by_identity(upsList[i]);
            if(ups){
                var upsItem = {
                    serverNO: ups.serverNO,
                    classID: ups.classID,
                    id: ups.id,
                    name: ups.fullName,
                    data: []
                };

                for(var j in dic){
                    var monthItem = dic[j];
                    var value = 0;
                    if(monthItem[item.serverNO]){
                        value = monthItem[ups.serverNO][ups.id];
                    }
                    upsItem.data.push(value || 0);
                }
                response.upsList.push(upsItem)
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x0000105B;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};