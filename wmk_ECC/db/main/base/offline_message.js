/**
 * Created by wangxh on 2018/1/9.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    type: Number,//通知方式
    recipient: Number,//
    title: String,
    content: String,
    time: Date
},{collection: "offline_message", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("offline_message", Schema);

    model.insert_offline_message = function (type, recipient, title, content, time, callback) {
        model.collection.insertOne({type: type, recipient: recipient, title: title, content: content, time: time}, callback);
    };

    model.find_offline_message = function (type, callback) {
        return model.find({type: type}, {}, callback);
    };

    model.remove_offline_message = function (params, callback) {
        model.remove(params, callback);
    };

    return model;
};