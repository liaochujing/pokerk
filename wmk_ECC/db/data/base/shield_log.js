/**
 * Created by wangxh on 2018/3/5.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    serverNO: Number,
    classID: Number,
    id: Number,
    user: Number,
    data: Object,
    time: Date
},{collection: "shield_log", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("shield_log", Schema);

    model.insert_log = function (serverNO, classID, id, user, data, time, callback) {
        model.collection.insertOne({
            serverNO: serverNO,
            classID: classID,
            id: id,
            user: user,
            data: data,
            time: time
        }, callback);
    };

    model.find_log = function (param, fields, callback) {
        model.collection.find(param, fields).toArray(callback);
    };

    return model;
};