/**
 * Created by wangxh on 2018/4/23.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: Number,
    user: Number,
    data: Object,
    time: Date
},{collection: "mobile_inspection", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("mobile_inspection", Schema);

    model.insert_inspection = function (id, user, data, time, callback) {
        model.collection.insertOne({
            _id: id,
            user: user,
            data: data,
            time: time
        }, callback);
    };

    model.find_inspection = function (param, fields, callback) {
        model.collection.find(param, fields).toArray(callback);
    };

    return model;
};