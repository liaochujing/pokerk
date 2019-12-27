/**
 * Created by wangxh on 2017/11/24.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: String,
    id: Number,
    name: String,
    desc: String,
    pointList: Object,
    data: String,
    config: Object,
    time: Date
},{collection: "collect_device_type", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("collect_device_type", Schema);

    model.insert_collect_device_type = function (id, name, desc, pointList, data, config, time, callback) {
        model.collection.insertOne({
            _id: id,
            id: id,
            name: name,
            desc: desc,
            pointList: pointList,
            data: data,
            config: config,
            time: time
        }, callback);
    };

    model.upsert_collect_device_type = function (id, name, desc, pointList, config, data, time, callback) {
        model.update({id: id}, {$set: {name: name, desc: desc, pointList: pointList, config: config, data: data, time: time}}, {upsert: true}, callback);
    };

    model.remove_collect_device_type = function (id, callback) {
        model.remove({id: id}, callback)
    };

    model.clear_collect_device_type = function (callback) {
        model.remove({}, callback);
    };

    model.find_collect_device_type = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};