/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db');

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);
    var month = body.month;

    var monthList = [];
    var _start = startTime.GetYear();
    while(_start < endTime){
        var _time1 = _start.AddMonth(month - 1);
        monthList.push(_time1.format_month(''));

        _start = _start.AddYear(1);
    }

    var areas = body.areas;
    if(areas.length > 0){
        var resDic = {};

        var set_value = function (item, sgItem) {
            var key = format_key(sgItem.system, sgItem.group);
            item[key] = sgItem.energy;
        };

        var get_area_data = function (done) {
            db.datadb.ammon.query({$or: areas, time: {$gte: startTime, $lt: endTime}, month: {$in: monthList}}, {_id: 0, serverNO: 1, classID: 1, id: 1, month: 1, enUsage: 1, itENUsage: 1/*, ljENUsage: 1, slENUsage: 1, dxENUsage: 1*/}, {time: 1}, function (err, results) {
                if(err) return done(err);

                if(results){
                    for(var i=0;i<results.length;i++){
                        var item = results[i];
                        var _key = format_key(item.serverNO, item.classID, item.id);
                        if(!resDic[_key]){
                            resDic[_key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []};
                        }
                        resDic[_key].list.push({month: item.month, energy: item.enUsage, '1_1': item.itENUsage/*, '2_1_1': item.ljENUsage, '2_1_2': item.slENUsage, '2_1_3': item.dxENUsage*/});
                    }
                }

                done();
            })
        };

        var get_system_group_data = function (done) {
            db.datadb.sgmon.query({$or: areas, time: {$gte: startTime, $lt: endTime}, month: {$in: monthList}}, {_id: 0, serverNO: 1, classID: 1, id: 1, system: 1, group: 1, month: 1, enUsage: 1}, {time: 1}, function (err, results) {
                if(err) return done(err);

                if(results){
                    var dic = {};
                    for(var i=0;i<results.length;i++){
                        var item = results[i];
                        var _key = format_key(item.serverNO, item.classID, item.id);
                        if(!dic[_key]){
                            dic[_key] = {};
                        }
                        if(!dic[_key][item.month]){
                            dic[_key][item.month] = [];
                        }
                        dic[_key][item.month].push({system: item.system, group: item.group, energy: format_value(item.enUsage)});
                    }

                    for(var k in resDic){
                        var buildingItem = resDic[k];
                        var sgDic = dic[k];

                        if(!sgDic){
                            continue;
                        }

                        var itemList = buildingItem.list;
                        for(var i=0;i<itemList.length;i++){
                            var item = itemList[i];

                            if(sgDic[item.month]){
                                var _list = sgDic[item.month];
                                for(var j=0;j<_list.length;j++){
                                    set_value(item, _list[j]);
                                }
                            }
                        }
                    }
                }

                done();
            })
        };

        ah.series([get_area_data, get_system_group_data], function (err) {
            if(err){
                callback(err);
                return;
            }

            var response = [];

            for(var i in resDic){
                response.push(resDic[i]);
            }

            callback(null, response);
        })
    }else{
        callback()
    }
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010051;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areas: {
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
        },
        month: {type: 'number', required: true},
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};