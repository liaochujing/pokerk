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

    if(endTime - startTime > 24 * 60 * 60 * 1000){
        callback({status: code.unknown, msg: '时间范围错误'});
        return;
    }

    var areas = body.areas;

    if(areas.length > 0){
        var resDic = {};

        var set_value = function (item, sgItem) {
            var key = format_key(sgItem.system, sgItem.group);
            item[key] = sgItem.energy;
        };

        var get_area_data = function (done) {
            db.datadb.amdata.query({$or: areas, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, energy: 1, en_it: 1, /*en_lj: 1, en_sl: 1, en_dx: 1, */time: 1}, {time: 1}, function (err, results) {
                if(err) return done(err);

                if(results){
                    var dic = {};
                    for(var i=0;i<results.length;i++){
                        var item = results[i];
                        var _key = format_key(item.serverNO, item.classID, item.id);
                        if(!dic[_key]){
                            dic[_key] = {serverNO: item.serverNO, classID: item.classID, id: item.id, list: []};
                        }
                        dic[_key].list.push({energy: item.energy, en_it: item.en_it, /*en_lj: item.en_lj, en_sl: item.en_sl, en_dx: item.en_dx, */time: item.time});
                    }

                    for(var k in dic){
                        var item = dic[k];

                        var _list = item.list;
                        if(_list){
                            var _dic = {};
                            for(var j=0;j<_list.length;j++){
                                var _item = _list[j];

                                var _time = new Date(_item.time);
                                var hour = _time.getHours();
                                var minute = _time.getMinutes();
                                var second = _time.getSeconds();

                                var interval = minute * 60 + second;
                                if(minute >= 30){
                                    hour++;
                                    interval = 60 * 60 - minute * 60 - second;
                                }
                                if(!_dic[hour]){
                                    _dic[hour] = {interval: interval, energy: _item.energy, en_it: _item.en_it, /*en_lj: item.en_lj, en_sl: item.en_sl, en_dx: item.en_dx, */time: _time};
                                }else{
                                    if(_dic[hour].interval > interval){
                                        _dic[hour] = {interval: interval, energy: _item.energy, en_it: _item.en_it, /*en_lj: item.en_lj, en_sl: item.en_sl, en_dx: item.en_dx, */time: _time};
                                    }
                                }
                            }

                            var _resList = [];
                            var _preValue = undefined;
                            for(var j=0;j<24;j++){
                                var v1 = _preValue;
                                var v2 = undefined;
                                if(_dic[j]){
                                    v1 = _dic[j];
                                }
                                if(_dic[j + 1]){
                                    v2 = _dic[j + 1];
                                }

                                _preValue = v1;
                                if(v1 != undefined && v2 != undefined){
                                    _resList.push({hour: j, energy: format_value(v2.energy - v1.energy), '1_1': format_value(v2.en_it - v1.en_it)/*, '2_1_1': format_value(v2.en_lj - v1.en_lj), '2_1_2': format_value(v2.en_sl - v1.en_sl), '2_1_3': format_value(v2.en_dx - v1.en_dx)*/});
                                }else{
                                    _resList.push({hour: j, energy: 0, '1_1': 0});
                                }
                            }
                            item.list = _resList;
                        }

                        resDic[k] = item;
                    }
                }

                done();
            })
        };

        var get_system_group_data = function (done) {
            db.datadb.sgdata.query({$or: areas, time: {$gte: startTime, $lt: endTime}}, {_id: 0, serverNO: 1, classID: 1, id: 1, system: 1, group: 1, energy: 1, time: 1}, {time: 1}, function (err, results) {
                if(err) return done(err);

                if(results){
                    var dic = {};
                    for(var i=0;i<results.length;i++){
                        var item = results[i];
                        var _key = format_key(item.serverNO, item.classID, item.id);
                        if(!dic[_key]){
                            dic[_key] = [];
                        }
                        dic[_key].push({system: item.system, group: item.group, energy: item.energy, time: item.time});
                    }

                    //允许的间隔
                    var max_interval = 60 * 1000;//一分钟

                    for(var k in resDic) {
                        var buildingItem = resDic[k];
                        var sgList = dic[k];

                        if (!sgList) {
                            continue;
                        }

                        var _dic = {};
                        for (var i = 0; i < sgList.length; i++) {
                            var sgItem = sgList[i];

                            var _time = sgItem.time;
                            var hour = _time.getHours();
                            var minute = _time.getMinutes();
                            var second = _time.getSeconds();

                            var interval = minute * 60 + second;
                            if (minute >= 30) {
                                hour++;
                                interval = 60 * 60 - minute * 60 - second;
                            }
                            var key = format_key(sgItem.system, sgItem.group);
                            if (!_dic[key]) {
                                _dic[key] = {};
                            }
                            if (!_dic[key][hour]) {
                                _dic[key][hour] = {interval: interval, energy: sgItem.energy};
                            } else {
                                if (_dic[key][hour].interval > interval) {
                                    _dic[key][hour] = {interval: interval, energy: sgItem.energy};
                                }
                            }
                        }

                        var _resDic = {};
                        for (var kk in _dic) {
                            var _item = _dic[kk];

                            var _teDic = {};
                            var _preValue = undefined;
                            for (var j = 0; j < 24; j++) {
                                var v1 = _preValue;
                                var v2 = undefined;
                                if (_item[j]) {
                                    v1 = _item[j].energy;
                                }
                                if (_item[j + 1]) {
                                    v2 = _item[j + 1].energy;
                                }

                                _preValue = v1;
                                if (v1 != undefined && v2 != undefined) {
                                    _teDic[j] = format_value(v2 - v1);
                                } else {
                                    _teDic[j] = 0;
                                }
                            }
                            _resDic[kk] = _teDic;
                        }

                        for (var i = 0; i < buildingItem.list.length; i++) {
                            var item = buildingItem.list[i];
                            for (var kk in _resDic) {
                                var _itemDic = _resDic[kk];
                                if (_itemDic[item.hour] != undefined) {
                                    item[kk] = _itemDic[item.hour];
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
module.exports.cmd = cmd.itr_0x00010047;
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
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};