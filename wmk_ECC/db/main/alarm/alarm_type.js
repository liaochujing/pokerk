/**
 * Created by wangxh on 2017/9/26.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: Number,
    id: Number,
    name: String,
    condition: Object,
    option: Object,
    config: Object,
    time: Date,
},{collection: "alarm_type", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("alarm_type", Schema);

    model.insert_alarm_type = function (id, name, condition, option, config, time, callback) {
        model.collection.insertOne({_id: id, id: id, name: name, condition: condition, option: option, config: config, time: time}, callback);
    };

    model.upsert_alarm_type = function (id, name, condition, option, config, time, callback) {
        model.update({id: id}, {$set: {name: name, condition: condition, option: option, config: config, time: time}}, {upsert: true}, callback);
    };

    model.remove_alarm_type = function (id, callback) {
        model.remove({id: id}, callback);
    };

    model.clear_alarm_type = function (callback) {
        model.remove({}, callback);
    };

    model.find_alarm_type = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};