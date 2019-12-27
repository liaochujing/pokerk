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
},{collection: "alarm_log", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("alarm_log", Schema);

    model.insert_log = function (serverNO, classID, id, userID, action, data, time, callback) {
        model.collection.insertOne({
            serverNO: serverNO,
            classID: classID,
            id: id,
            user: userID,
            action: action,
            data: data,
            time: time
        }, callback);
    };

    model.find_and_remove = function (param, fields, callback) {
        return model.collection.find(param, fields).toArray(function (err, records) {
            if(err) return callback(err);
            model.collection.remove(param, function (err) {
                if(err) return callback(err);
                callback(null, records);
            })
        });
    };

    model.find_log = function (param, fields, callback) {
        return model.collection.find(param, fields).toArray(callback);
    };

    return model;
};