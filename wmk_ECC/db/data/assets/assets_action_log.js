/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    aNO: String,
    action: Number,
    option: Object,
    time: Date
},{collection: "asset_log", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("asset_log", Schema);

    model.insert_log = function (aNO, action, option, time, callback) {
        model.collection.insertOne({
            aNO: aNO,
            action: action,
            option: option,
            time: new Date()
        }, callback);
    };

    model.clear_log = function (aNO, callback) {
        model.collection.remove({aNO: aNO}, callback);
    };

    model.find_log = function (param, fields, callback) {
        model.collection.find(param, fields).toArray(callback);
    };

    return model;
};