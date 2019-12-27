/**
 * Created by wangxh on 2017/11/13.
 */

'use strict';

var ah = require('../util/array_helper');
var st = require('../util/small_tools');

var db = require('../db');
var hisdp = db.datadb.hisdp;

function find_by_time(point, from, to, callback) {
    var _modelList = [];

    var _start = from.GetDate();
    var _end = to;
    while(_start < _end){
        var key = hisdp.format_key(_start);
        _modelList.push(key);
        _start = _start.AddDays(1);
    }

    var res = [];
    ah.each_series(_modelList, function (model, cbItem) {
        hisdp.find_hisdp(model, [point], from, to, function (err, data) {
            if(err) return cbItem(err);

            if(data){
                res = res.concat(data);
            }

            cbItem();
        })
    }, function (err) {
        if(err) return callback(err);
        callback(null, res);
    });
}

function batch_find_by_time(points, from, to, callback) {
    var _modelList = [];

    var _start = from.GetDate();
    var _end = to;
    while(_start < _end){
        var key = hisdp.format_key(_start);
        _modelList.push({time: _start, model: key});
        _start = _start.AddDays(1);
    }
    var _pdic = {};
    for(var i=0;i<points.length;i++){
        var _p = points[i];

        if(!_pdic[_p.serverNO]){
            _pdic[_p.serverNO] = {};
        }
        if(!_pdic[_p.serverNO][_p.id]){
            _pdic[_p.serverNO][_p.id] = _p;
        }
    }

    var _points = [];
    for(var i=0;i<points.length;i++){
        var point = points[i];
        _points.push({s: point.serverNO, id: point.id, i: point.pointIndex});
    }

    var _dic = {};
    var _res_list = [];
    ah.each_limit(_modelList, function (moduleItem, cbItem) {
        hisdp.find_hisdp(moduleItem.model, _points, from, to, function (err, data) {
            if(err) return cbItem(err);
            if(data){
                _res_list.push({time: moduleItem.time, data: data});
            }
            cbItem();
        })
    }, function (err) {
        if(err) return callback(err);

        _res_list.sort(function (item1, item2) {
           if(item1.time > item2.time){
               return 1;
           }else{
               return -1;
           }
        });

        for(var j=0;j<_res_list.length;j++){
            var data = _res_list[j].data;

            for(var i=0;i<data.length;i++){
                var item = data[i];

                if(!_dic[item.s]){
                    _dic[item.s] = {};
                }
                if(!_dic[item.s][item.id]){
                    _dic[item.s][item.id] = {};
                }
                var _list = _dic[item.s][item.id][item.i];
                if(!_list){
                    var _p = _pdic[item.s][item.id];

                    _dic[item.s][item.id][item.i] = {serverNO: item.s, classID: _p.classID, id: item.id, pointIndex: item.i, list: []};
                    _list = _dic[item.s][item.id][item.i];
                }
                _list.list.push({v: item.v, t: item.t});
            }
        }

        var res = [];
        for(var s in _dic){
            var serverItem = _dic[s];
            for(var id in serverItem){
                var deviceItem = serverItem[id];
                for(var i in deviceItem){
                    res.push(deviceItem[i]);
                }
            }
        }
        
        callback(null, res);
    }, 5);
}

function batch_find_first_by_time(points, from, to, callback) {
    var _modelList = [];

    var _start = from.GetDate();
    var _end = to;
    while(_start < _end){
        var key = hisdp.format_key(_start);
        _modelList.push(key);
        _start = _start.AddDays(1);
    }

    var _dic = {};
    ah.each_series(_modelList, function (model, cbItem) {
        hisdp.find_first_hisdp(model, points, function (err, data) {
            if(err) return cbItem(err);

            if(data){
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    if(!_dic[item.s]){
                        _dic[item.s] = {};
                    }
                    if(!_dic[item.s][item.id]){
                        _dic[item.s][item.id] = {};
                    }
                    var _list = _dic[item.s][item.id][item.i];
                    if(!_list){
                        _dic[item.s][item.id][item.i] = {serverNO: item.s, classID: item.c, id: item.id, pointIndex: item.i, list: []};
                        _list = _dic[item.s][item.id][item.i];
                    }
                    _list.list.push({v: item.v, t: item.t});
                }
            }

            cbItem();
        })
    }, function (err) {
        if(err) return callback(err);

        var res = [];
        for(var s in _dic){
            var serverItem = _dic[s];
            for(var id in serverItem){
                var deviceItem = serverItem[id];
                for(var i in deviceItem){
                    res.push(deviceItem[i]);
                }
            }
        }

        callback(null, res);
    });
}

function batch_find_first_by_time_list(points, timeList, callback) {
    var _modelList = [];

    for(var i=0;i<timeList.length;i++){
        var time = timeList[i];
        var key = hisdp.format_key(time);
        _modelList.push(key);
    }

    var _dic = {};
    ah.each_series(_modelList, function (model, cbItem) {
        hisdp.find_first_hisdp(model, points, function (err, data) {
            if(err) return cbItem(err);

            if(data){
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    if(!_dic[item.s]){
                        _dic[item.s] = {};
                    }
                    if(!_dic[item.s][item.id]){
                        _dic[item.s][item.id] = {};
                    }
                    var _list = _dic[item.s][item.id][item.i];
                    if(!_list){
                        _dic[item.s][item.id][item.i] = {serverNO: item.s, classID: item.c, id: item.id, pointIndex: item.i, list: []};
                        _list = _dic[item.s][item.id][item.i];
                    }
                    _list.list.push({v: item.v, t: item.t});
                }
            }

            cbItem();
        })
    }, function (err) {
        if(err) return callback(err);

        var res = [];
        for(var s in _dic){
            var serverItem = _dic[s];
            for(var id in serverItem){
                var deviceItem = serverItem[id];
                for(var i in deviceItem){
                    res.push(deviceItem[i]);
                }
            }
        }

        callback(null, res);
    });
}

function find_point_by_time_list(point, timeList, callback) {
    if(!timeList || timeList.length <= 0){
        callback();
        return;
    }

    var _dic = {};
    for(var i=0;i<timeList.length;i++){
        var item = timeList[i];
        var _from = new Date(item.from);
        var _to = new Date(item.to);

        var from = _from;
        var to = _to;

        if(from > to){
            from = _to;
            to = _from;
        }
        var skey = hisdp.format_key(from);
        var tkey = hisdp.format_key(to);
        if(!_dic[skey]){
            _dic[skey] = {key: skey, list: []};
        }
        if(skey == tkey){
            _dic[skey].list.push({from: _from, to: _to})
        }else{
            _dic[skey].list.push({from: _from});
            var _start = from.GetDate().AddDays(1);
            while(_start < to){
                var _skey = hisdp.format_key(_start);
                if(_skey == tkey){
                    if(!_dic[_skey]){
                        _dic[_skey] = {key: _skey, list: []};
                    }
                    _dic[_skey].list.push({to: _to});
                }else{
                    if(!_dic[_skey]){
                        _dic[_skey] = {key: _skey, list: []};
                    }
                    _dic[_skey].list.push({})
                }
                _start = _start.AddDays(1);
            }
        }
    }

    var params = [];
    for(var i in _dic){
        var item = _dic[i];

        var _timeParam = [];
        for(var j=0;j<item.list.length;j++){
            var _timeItem = item.list[j];
            var _t = undefined;
            if(_timeItem.from){
                _t = {$gte: _timeItem.from};
            }
            if(_timeItem.to){
                if(!_t){
                    _t = {};
                }
                _t['$lt'] = _timeItem.to;
            }
            if(_t){
                _timeParam.push({t: _t});
            }
        }
        if(_timeParam.length > 0){
            if(_timeParam.length == 1){
                params.push({key: item.key, param: {s: point.serverNO, id: point.id, i: point.pointIndex, t: _timeParam[0].t}})
            }else{
                var _param = {s: point.serverNO, id: point.id, i: point.pointIndex};
                _param['$or'] = _timeParam;
                params.push({key: item.key, param: _param});
            }
        }else{
            params.push({key: item.key, param: {s: point.serverNO, id: point.id, i: point.pointIndex}})
        }
    }

    var res = [];
    ah.each_series(params, function (item, cbItem) {
        hisdp.find_hisdp_by_param(item.key, item.param, function (err, data) {
            if(err) return cbItem(err);
            res = res.concat(data);
            cbItem()
        });
    }, function () {
        callback(null, res);
    });
}

module.exports.find_by_time = find_by_time;
module.exports.batch_find_by_time = batch_find_by_time;
module.exports.batch_find_first_by_time = batch_find_first_by_time;
module.exports.batch_find_first_by_time_list = batch_find_first_by_time_list;
module.exports.find_point_by_time_list = find_point_by_time_list;