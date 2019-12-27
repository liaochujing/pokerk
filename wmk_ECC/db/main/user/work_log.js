/**
 * Created by wangxh on 2017/11/9.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: Number,
    serverNO: Number,
    classID: Number,
    id: Number,
    logID: Number,
    content: Object,
    modifyTime: Date,
    createTime: Date
},{collection: "work_log", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("work_log", Schema);

    model.insert_work_log = function (serverNO, classID, id, logID, content, time, callback) {
        model.collection.insertOne({
            _id: logID,
            serverNO: serverNO,
            classID: classID,
            id: id,
            logID: logID,
            content: content,
            createTime: time,
            modifyTime: time
        }, callback);
    };

    model.update_work_log = function (logID, content, time, callback) {
        model.update({logID: logID}, {$set: {content: content, modifyTime: time}}, callback)
    };

    model.find_work_log = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};