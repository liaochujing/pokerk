/**
 * Created by wangxh on 2017/11/13.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    serverNO: Number,
    classID: Number,
    id: Number,
    user: Number,
    action: Number,
    data: Object,
    time: Date
},{collection: "his_alarm_log", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("his_alarm_log", Schema);

    model.insert_logs = function (records, callback) {
        if(!records || records.length == 0){
            return callback();
        }
        
        model.collection.insert(records, callback);
    };

    return model;
};