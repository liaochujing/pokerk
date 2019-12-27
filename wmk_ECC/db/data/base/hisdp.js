/**
 * Created by wangxh on 2017/10/10.
 */

'use strict';

var st = require('../../../util/small_tools');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var mongoose = require('mongoose');

var Schema = new mongoose.Schema({},{versionKey: false});

var models = {};

module.exports = function (conn) {
    function get_model(key, callback) {
        if(models[key]){
            callback(null, models[key]);
        }else{
            var _model = conn.model(key, Schema);
            models[key] = _model;
            callback(null, _model);
            // var _collection = key;
            // conn.db.createCollection(_collection, { storageEngine: {wiredTiger: { configString: 'block_compressor=zlib' }}}, function (err) {
            //     if(err) return callback(err);
            //
            //     var _model = conn.model(key, Schema);
            //     _collection = _model.collection;
            //     //TODO:{unique: 1}
            //     _collection.ensureIndex({s: 1, id: 1, i: 1}/*, {unique: 1}*/, function (err) {
            //         if(err) return callback(err);
            //         models[key] = _model;
            //
            //         callback(null, _model);
            //     })
            // });
        }
    }

    var exp = {};

    exp.format_key = function (time) {
        //TODO: 不同版本数据使用不同表名称格式
        return 'new_hisdp_' + time.format_day('');
        // if(time < _min_date){
        //     return 'hisdp_' + time.format_day('');
        // }else{
        //     return 'new_hisdp_' + time.format_day('');
        // }
    };

    exp.batch_insert_hisdp = function (key, hisdps, callback) {
        get_model(key, function (err, module) {
            if(err) return callback(err);
            if(key.length == 14){//旧版本数据
                _batch_insert_hisdp_v1(module, hisdps, callback);
            }else{
                _batch_insert_hisdp_v2(module, hisdps, callback);
            }
        })
    };

    exp.find_hisdp = function (key, points, from, to, callback) {
        get_model(key, function (err, module) {
            if(err) return callback(err);
            if(key.length == 14){//旧版本数据
                _find_hisdp_v1(module, points, from, to, callback);
            }else{
                _find_hisdp_v2(module, points, from, to, callback);
            }
        })
    };

    exp.find_hisdp_by_param = function (key, param, callback){
        get_model(key, function (err, module) {
            if(err) return callback(err);
            if(key.length == 14){//旧版本数据
                _find_hisdp_by_param_v1(module, param, callback);
            }else{
                _find_hisdp_by_param_v2(module, param, callback);
            }
        })
    };

    exp.find_first_hisdp = function (key, points, callback){
        get_model(key, function (err, module) {
            if(err) return callback(err);
            if(key.length == 14){//旧版本数据
                _find_first_hisdp_v1(module, points, callback);
            }else{
                _find_first_hisdp_v2(module, points, callback);
            }
        })
    };


    function _batch_insert_hisdp_v2(model, hisdps, callback) {
        var options = [];
        for(var i=0;i<hisdps.length;i++){
            var _dp = hisdps[i];
            options.push({updateOne: {filter: {s: _dp.s, id: _dp.id, i: _dp.i}, update: {$push: {l: {v: _dp.v, t: _dp.t}}}, upsert: true}});
        }

        model.collection.bulkWrite(options, callback);
        // model.collection.insert(hisdps, callback);
    }

    function _batch_insert_hisdp_v1(model, hisdps, callback) {
        model.collection.insert(hisdps, callback);
    }


    function _find_hisdp_v2(model, points, from, to, callback) {
        var _match = undefined;
        if(points instanceof Array){
            _match = {$or: points};
        }else{
            _match = points;
        }

        var options = [{$match: _match}, {$unwind: '$l'}, {$project: {s: '$s', id: '$id', i: '$i', v: '$l.v', t: '$l.t'}}];
        var _t = undefined;
        if(from.getHours() != 0 || from.getMinutes() != 0 || from.getSeconds() != 0){
            _t= {$gt: from};
        }
        if(to.getHours() != 23 || to.getMinutes() != 59 || to.getSeconds() != 59){
            if(!_t){
                _t = {};
            }
            _t['$lt'] = to;
        }
        if(_t != undefined){
            options.push({$match: {t: _t}});
        }

        model.collection.aggregate(options, callback)
    }

    function _find_hisdp_v1(model, points, from, to, callback) {
        if(!points || points.length <= 0){
            callback();
            return;
        }
        var query = {$or: points};

        var _t = undefined;
        if(from.getHours() != 0 || from.getMinutes() != 0 || from.getSeconds() != 0){
            _t= {$gt: from};
        }
        if(to.getHours() != 23 || to.getMinutes() != 59 || to.getSeconds() != 59){
            if(!_t){
                _t = {};
            }
            _t['$lt'] = to;
        }
        if(_t != undefined){
            query.t = _t;
        }

        model.collection.find(query, {_id: 0}).toArray(callback);
    }


    function _find_hisdp_by_param_v2(model, param, callback) {
        var options = [{$match: {s: param.s, id: param.id, i: param.i}}, {$unwind: '$l'}, {$project: {v: '$l.v', t: '$l.t'}}];
        if(param.t){
            options.push({$match: {t: param.t}})
        }

        model.collection.aggregate(options, callback);
    }

    function _find_hisdp_by_param_v1(model, param, callback) {
        model.collection.find(param, {_id: 0, v:1, t: 1}).toArray(callback);
    }


    function _find_first_hisdp_v2(model, points, callback) {
        if(!points || points.length <= 0){
            callback();
            return;
        }
        var _dic = {};
        var _list = [];
        for(var i=0;i<points.length;i++){
            var _p = points[i];
            var _key = format_key(_p.serverNO, _p.id, _p.pointIndex);
            _dic[_key] = _p;
            _list.push({s: _p.serverNO, id: _p.id, i: _p.pointIndex});
        }

        model.collection.aggregate([{$match: {$or: _list}}, {$project: {s: '$s', id: '$id', i: '$i', data: {$slice: ['$l', 0, 1]}}}], function (err, results) {
            if(err) return callback(err);

            var res = [];
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    var _key = format_key(item.s, item.id, item.i);
                    var _p = _dic[_key];

                    var _item = {s: _p.serverNO, c: _p.classID, id: _p.id, i: _p.pointIndex};
                    if(item.data && item.data.length > 0){
                        var record = item.data[0];
                        _item.v = record.v;
                        _item.t = record.t;
                    }
                    res.push(_item);
                }
            }

            callback(null, res);
        });
    }

    function _find_first_hisdp_v1(model, points, callback) {
        if(!points || points.length <= 0){
            callback();
            return;
        }
        var res = [];

        ah.each_limit(points, function (point, cbItem) {
            model.collection.find({s: point.serverNO, id: point.id, i: point.pointIndex}).sort({time: 1}).limit(1).toArray(function (err, points) {
                if(err) return cbItem(null, {serverNO: point.serverNO, classID: point.classID, id: point.id, pointIndex: point.pointIndex});
                if(points && points.length > 0){
                    var _p = {s: point.serverNO, c: point.classID, id: point.id, i: point.pointIndex};
                    _p.v = points[0].v;
                    _p.t = points[0].t;
                    res.push(_p);
                }
                cbItem();
            });
        }, function (err) {
            callback(err, res);
        }, 10);
    }


    // //此方法，仅针对整理过的数据进行查询
    // exp.query = function (key, param, callback) {
    //     get_model(key, function (err, model) {
    //         if(err) return callback(err);
    //         model.collection.find(param, {_id: -1}).toArray(callback);
    //     });
    // };

    return exp;
};