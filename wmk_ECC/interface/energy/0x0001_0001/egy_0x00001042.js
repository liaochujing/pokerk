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
        upsList: []
    };

    var startTime = new Date().GetDate().AddDays(-30);
    var endTime = new Date().GetDate();

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

    datadb.dmday.query({time: {$gte: startTime, $lt: endTime}, $or: idList}, {serverNO: 1, id: 1, day: 1, in_power: 1, out_power: 1}, function (err, results) {
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
                dic[item.day][item.serverNO][item.id] = item;
            }
        }

        for(var i in dic){
            response.dayList.push(i);
        }

        for(var i in upsList){
            var ups = ramdb.no.get_by_identity(upsList[i]);
            if(ups){

                var upsItem = {
                    name: ups.fullName,
                    data: []
                };

                for(var j in dic){
                    var eff = 0;
                    var dayItem = dic[j];
                    if(dayItem[ups.serverNO]){
                        var points = dayItem[ups.serverNO][ups.id];
                        if(points && points.in_power && points.out_power){
                            eff = points.out_power / points.in_power;
                        }
                    }
                    upsItem.data.push(format_value(eff));
                }
                response.upsList.push(upsItem)
            }
        }

        callback(null, response);
    })

}

module.exports.cmd = cmd.cmd_0x00001042;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};