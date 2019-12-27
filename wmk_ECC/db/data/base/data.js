/**
 * Created by wangxh on 2017/10/25.
 */

'use strict';

var logger = require('../../../util/log_manager').logger;
var mongoose = require('mongoose');

module.exports = function (key, conn, opt) {
    var collection = conn.collection(key);
    var _cache_collection = undefined;

    if(opt && opt.cache){
        _cache_collection = conn.collection(key + '_cache');
        if(!opt.keep_days) {
            opt.keep_days = 1;
        }
        setInterval(function () {
            _cache_collection.remove({time: {$lt: new Date().AddDays(-opt.keep_days).AddHours(-1)}}, function (err) {
                if(err) logger.error({msg: 'auto clear cache data failed', collection: key, err: err})
            })
        }, 60 * 60 * 1000); //每小时清理一次数据
    }

    function get_cache_collection() {
        if(_cache_collection != undefined){
            let _interval = Date.now() - global.start_cache_time;
            if(_interval >= opt.keep_days * 24 * 60 * 60 * 1000){
                return _cache_collection;
            }else{
                return collection;
            }
        }else{
            return collection;
        }
    }

    var exp = {};

    //插入
    exp.insert = function (datas, callback) {
        collection.insert(datas, callback);
        if(_cache_collection != undefined){
            _cache_collection.insert(datas)
        }
    };

    //遍历(大量数据自动分页查询)
    exp.find = function (param, fields, cbPage, cbFinal) {
        collection.find(param, fields).toArray(function (err, data) {
            if(err) return cbFinal(err);
            
            if(data && data.length > 0){
                cbPage(data);
            }

            cbFinal();
        });

        // collection.count(param, function (err, count) {
        //     if(err) return cbFinal(err);
        //     if(count <= 0){
        //         cbFinal();
        //         return;
        //     }
        //
        //     var totalCount = count;
        //     var from = 0;
        //     var pageCount = 10000;
        //
        //     function find_page() {
        //         collection.find(param, fields).skip(from).limit(pageCount).toArray(function (err, data) {
        //             if(err) return cbFinal(err);
        //             from+=pageCount;
        //             if(data && data.length > 0){
        //                 cbPage(data);
        //             }
        //             data.length = 0;
        //             data = null;
        //
        //             if(from >= totalCount){
        //                 cbFinal();
        //             }else{
        //                 find_page();
        //             }
        //         })
        //     }
        //
        //     find_page();
        // });
    };
    exp.find_cache = function (param, fields, cbPage, cbFinal) {
        let _collection = get_cache_collection();
        _collection.find(param, fields).toArray(function (err, data) {
            if(err) return cbFinal(err);

            if(data && data.length > 0){
                cbPage(data);
            }

            cbFinal();
        });
    };

    //查询最后一条记录
    exp.find_last = function (param, fields, callback) {
        collection.find(param, fields).sort({time: -1}).limit(1).toArray(function (err, result) {
            if(err) return callback(err);

            var data = undefined;
            if(result){
                data = result[0];
            }

            callback(null, data);
        });
    };
    exp.find_last_cache = function (param, fields, callback) {
        let _collection = get_cache_collection();
        _collection.find(param, fields).sort({time: -1}).limit(1).toArray(function (err, result) {
            if(err) return callback(err);

            var data = undefined;
            if(result){
                data = result[0];
            }

            callback(null, data);
        });
    };

    //是否存在
    exp.exists = function (param, callback) {
        collection.findOne(param, {_id: 1}, function (err, record) {
            if(err) return callback(err);
            if(record){
                callback(null, true);
            }else{
                callback(null, false);
            }
        });
    };
    exp.exists_cache = function (param, callback) {
        let _collection = get_cache_collection();
        _collection.findOne(param, {_id: 1}, function (err, record) {
            if(err) return callback(err);
            if(record){
                callback(null, true);
            }else{
                callback(null, false);
            }
        });
    };

    //查询
    exp.query = function (param, fields, sort, callback) {
        if(callback == undefined){
            callback = sort;
            collection.find(param, fields).toArray(callback)
        }else{
            collection.find(param, fields).sort(sort).toArray(callback)
        }
    };

    //统计
    exp.aggregate = function (param, callback) {
        collection.aggregate(param, callback);
    };

    //删除
    exp.remove = function (param, callback) {
        collection.remove(param, callback);
    };

    return exp;
};