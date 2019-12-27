/**
 * Created by wangxh on 2017/10/10.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: String,
    serverNO: Number,
    classID: Number,
    id: Number,
    open_id: String,
    third_party_id: String,//第三方事件ID

    type: Number,//类型
    area: Number,//区域

    source: Object,
    vSource: Object,
    level: Number,
    // priority: Number,
    star: Object,//星标
    desc: String,   //描述

    startTime: Date,
    endTime: Date,

    start: Object,
    isEnd: Number,//自动结束
    end:Object,
    manual_end: Object,
    
    isForce: Number,//强制结束
    force: Object,
    isConfirmed: Number,//确认
    confirmed: Object,
    isHangup: Number,//挂起
    hangup: Object,
    isFiltered: Number,//收敛
    parent: Object,

    time: Date
},{collection: "hisalarm", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("hisalarm", Schema);

    model.insert_hisalarm = function (alarm, callback) {
        model.collection.insertOne(alarm, callback);
    };

    model.batch_upsert = function (alarms, callback) {
        if(alarms && alarms.length > 0){
            var options = [];
            for(var i=0;i<alarms.length;i++){
                var item = alarms[i];
                item._id = format_key(item.serverNO, item.classID, item.id);
                options.push({updateOne: {filter: {_id: item._id}, update: item, upsert: true}});
            }
            model.collection.bulkWrite(options, callback);
        }else{
            callback();
        }
    };

    model.find_last_his_alarm = function (serverNO, callback) {
        model.collection.find({serverNO: serverNO}).sort({time: -1}).limit(1).toArray(function (err, results) {
            if(err) return callback(err);
            var record = undefined;
            if(results && results.length > 0){
                record = results[0];
            }
            callback(null, record);
        });
    };

    model.find_his_alarm = function (param, fields, callback) {
        if(callback){
            model.collection.find(param, fields).toArray(callback);
        }else{
            return model.collection.find(param, fields)
        }
    };

    return model;
};