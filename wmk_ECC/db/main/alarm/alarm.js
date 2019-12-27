/**
 * Created by wangxh on 2017/3/23.
 */

'use strict';

var mongoose = require('mongoose');

var AlarmSchema = new mongoose.Schema({
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
    unhangup: Object,//解挂

    isFiltered: Number,//收敛
    parent: Object,

    notify: Object,//通知信息
    order: Object,
    time: Date
},{collection: "alarm", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("alarm", AlarmSchema);

    model.insert_alarm = function (alarm, callback) {
        model.collection.insertOne(alarm, callback);
    };
    
    model.delete_alarm = function (serverNO, classID, id, callback) {
        model.collection.remove({serverNO: serverNO, classID: classID, id: id}, callback);
    };
    
    model.remove_convergence = function (serverNO, classID, id, time, callback) {
        model.collection.update({'parent.serverNO': serverNO, 'parent.classID': classID, 'parent.id': id}, {$unset: {isFiltered: 1, parent: 1}, $set: {time: time}}, {multi: true}, callback)
    };
    
    model.add_convergence_list = function (identity, list, time, callback) {
        if(!time){
            time = new Date();
        }
        var options = [];
        for(var i=0;i<list.length;i++){
            var item = list[i];
            options.push({updateOne: {filter: {serverNO: item.serverNO, classID: item.classID, id: item.id}, update: {$set: {isFiltered: 1, parent: identity, time: time}}}})
        }
        model.collection.bulkWrite(options, callback);
    };

    model.set_end = function (serverNO, classID, id, option, time, callback) {
        if(!time){
            time = new Date();
        }
        model.collection.update({serverNO: serverNO, classID: classID, id: id, isEnd: {$ne: 1}}, {$set: {isEnd: 1, end: option, endTime: option.time, time: time}}, callback);
    };

    model.set_manual_end = function (serverNO, classID, id, option, time, callback) {
        if(!time){
            time = new Date();
        }
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: {manual_end: option, endTime: option.time, time: time}}, callback);
    };

    model.set_force_end = function (serverNO, classID, id, option, time, callback) {
        if(!time){
            time = new Date();
        }
        model.collection.update({serverNO: serverNO, classID: classID, id: id, isForce: {$ne: 1}}, {$set: {isForce: 1, force: option, time: time}}, function (err, res) {
            if(err) return callback(err);
            callback(null, res.result)
        });
    };

    model.set_confirmed = function (serverNO, classID, id, option, time, callback) {
        if(!time){
            time = new Date();
        }
        model.collection.update({serverNO: serverNO, classID: classID, id: id, isConfirmed: {$ne: 1}}, {$set: {isConfirmed: 1, confirmed: option, time: time}}, function (err, res) {
            if(err) return callback(err);
            callback(null, res.result)
        });
    };

    model.set_hangup = function (serverNO, classID, id, option, time, callback) {
        if(!time){
            time = new Date();
        }
        model.collection.update({serverNO: serverNO, classID: classID, id: id, isHangup: {$ne: 1}}, {$set: {isHangup: 1, hangup: option, time: time}, $unset: {unhangup: 1}}, function (err, res) {
            if(err) return callback(err);
            callback(null, res.result)
        });
    };

    model.set_unhangup = function (serverNO, classID, id, option, time, callback) {
        if(!time){
            time = new Date();
        }
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: {isHangup: 0, unhangup: option, time: time}}, function (err, res) {
            if(err) return callback(err);
            callback(null, res.result)
        });
    };
    
    model.set_star = function (serverNO, classID, id, user, star, callback) {
        var setPro = {};
        setPro['star.' + user] = star;
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: setPro}, callback);
    };

    model.set_related_order = function (serverNO, classID, id, order, callback) {
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: {order: order}}, callback);
    };
    
    model.batch_set_notify_info = function (list, callback) {
        if(!list || list.length <= 0){
            callback();
            return;
        }
        var options = [];
        for(var i=0;i<list.length;i++){
            var item = list[i];

            var setPro = {};
            setPro['notify.' + item.key] = item.option;

            options.push({updateOne: {filter: {serverNO: item.serverNO, classID: item.classID, id: item.id}, update: {$set: setPro}}})
        }
        model.collection.bulkWrite(options, callback);
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

    model.batch_remove = function (identities, callback) {
        if(identities && identities.length > 0){
            model.collection.remove({$or: identities}, callback)
        }else{
            callback();
        }
    };

    model.update_alarm = function (filter, update, callback) {
        model.collection.update(filter, update, function (err, res) {
            if(err) return callback(err);
            callback(null, res.result);
        });
    };

    model.find_last_updated = function (serverNO, callback) {
        model.collection.find({serverNO: serverNO}).sort({time: -1}).limit(1).toArray(function (err, results) {
            if(err) return callback(err);
            var record = undefined;
            if(results && results.length > 0){
                record = results[0];
            }
            callback(null, record);
        });
    };

    model.find_alarm = function (param, fields, callback) {
        if(callback){
            model.collection.find(param, fields).toArray(callback);
        }else{
            return model.collection.find(param, fields);
        }
    };

    model.find_all_alarm = function (param, fields, cbPage, cbFinal) {
        model.count(param, function (err, count) {
            if(err) return cbFinal(err);
            var totalCount = count;
            var from = 0;
            var pageCount = 10000;

            function find_page() {
                model.collection.find(param, fields).skip(from).limit(pageCount).toArray(function (err, data) {
                    if(err) return cbFinal(err);
                    from+=pageCount;
                    if(data && data.length > 0){
                        cbPage(data);
                    }
                    data.length = 0;
                    data = null;
                    if(from >= totalCount){
                        cbFinal();
                    }else{
                        find_page();
                    }
                })
            }

            find_page();
        });
    };

    return model;
};