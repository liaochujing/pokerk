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

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetDate().AddDays(-30);
    var endTime = new Date().GetDate();

    var response = {
        timeList: [],
        dataList: []
    };


    var wcUnitsList = ramdb.no.get_by_class_list(uiclassID.WCUnit_List, body.serverNO);
    var ids = [];
    for(var i in wcUnitsList){
        var item = wcUnitsList[i];
        ids.push({serverNO: item.serverNO, classID: item.classID, id: item.id})
    }

    if(ids.length <= 0){
        callback(null, response);
        return;
    }

    datadb.dmday.query({time: {$gte: startTime, $lt: endTime}, $or: ids}, {_id: 0}, function (err, results) {
        if(err) logger.error(err);

        var dic = {};
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];

                if(!dic[item.day]){
                    dic[item.day] = {}
                }
                if(!dic[item.day][item.serverNO]){
                    dic[item.day][item.serverNO] = {}
                }
                dic[item.day][item.serverNO][item.id] = item.cop;
            }
        }

        for(var i in dic){
            response.timeList.push(i);
        }

        for(var i=0;i<wcUnitsList.length;i++){
            var device = wcUnitsList[i];

            var deviceItem = {name: device.fullName, list: []};

            for(var j in dic){
                var _dayItem = dic[j];

                var value = 0;
                if(_dayItem[device.serverNO]){
                    value = _dayItem[device.serverNO][device.id] || 0;
                }

                deviceItem.list.push(value);
            }

            response.dataList.push(deviceItem);
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00003006;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};