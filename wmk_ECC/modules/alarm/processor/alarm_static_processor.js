/**
 * Created by wangxh on 2018/3/1.
 */

'use strict';

var logger = require('../../../util/log_manager').logger;
var ah = require('../../../util/array_helper');

var db = require('../../../db');
var dbAlarm = db.alarm;
var dbHisAlarm = db.datadb.hisalarm;

var _mon_alarm_count = undefined;

function aggregate_alarm_count(from, to, callback) {
    dbAlarm.aggregate([
        {$match: {startTime: {$gt: from, $lt: to}}},
        {$group: {
            _id: {
                serverNO: '$source.serverNO',
                classID: '$source.classID',
                id: '$source.id'
            },
            count: {$sum: 1}
        }}
    ], function (err, results) {
        callback(err, results);
    })
}

function aggregate_his_alarm_count(from, to, callback) {
    dbHisAlarm.aggregate([
        {$match: {startTime: {$gt: from, $lt: to}}},
        {$group: {
            _id: {
                serverNO: '$source.serverNO',
                classID: '$source.classID',
                id: '$source.id'
            },
            count: {$sum: 1}
        }}
    ], function (err, results) {
        callback(err, results);
    })
}

function get_alarm_count(from, to, callback) {
    ah.parallel([function (done) {
        aggregate_alarm_count(from, to, done)
    }, function (done) {
        aggregate_his_alarm_count(from, to, done)
    }], function (err, results) {
        if(err) return callback(err);
        var res = [];
        if(results){
            var dic = {};
            for(var i=0;i<results.length;i++){
                var list = results[i];
                for(var j=0;j<list.length;j++){
                    var item = list[j];
                    var key = format_key(item._id.serverNO, item._id.classID, item._id.id);
                    if(dic[key]){
                        dic[key].count+=item.count;
                    }else{
                        dic[key] = item;
                    }
                }
            }
            for(var i in dic){
                res.push(dic[i]);
            }
        }
        if(res.length > 0){
            res.sort(function (item1, item2) {
                if(item1.count > item2.count){
                    return 1
                }else if(item1.count == item2.count){
                    return 0;
                }else{
                    return -1;
                }
            });
            if(res.length > 10){
                res.splice(0, 10);
            }
        }
        if(res && res.length > 0){
            var response = [];
            for(var i=0;i<res.length;i++){
                var item = res[i];
                response.push({serverNO: item._id.serverNO, classID: item._id.classID, id: item._id.id, count: item.count});
            }
            callback(null, response);
        }else{
            callback();
        }
    })
}

function _get_alarm_count_month() {
    var from = new Date().GetMonth();
    var to = new Date();
    get_alarm_count(from, to, function (err, results) {
        if(err) logger.error(err);
        if(results){
            _mon_alarm_count = results;
        }
    })
}

function get_alarm_count_month(callback) {
    callback(null, _mon_alarm_count);
}

function get_alarm_count_day(callback) {
    var from = new Date().GetDate();
    var to = new Date();
    get_alarm_count(from, to, callback)
}

function start_static() {
    setInterval(function () {
        _get_alarm_count_month();
    }, 60 * 60 * 1000);

    //5s后计算一次
    setTimeout(function () {
        _get_alarm_count_month();
    }, 5000);
}

module.exports.start_static = start_static;
module.exports.get_alarm_count_month = get_alarm_count_month;
module.exports.get_alarm_count_day = get_alarm_count_day;