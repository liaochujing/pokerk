/**
 * Created by wangxh on 2017/11/3.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: String,
    system: Number,
    systemName: String,
    group: Number,
    groupName: String,
    id: Number,
    name: String,
    desc: String,
    pointList: Object,
    config: Object,
    time: Date
},{collection: "device_type", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("device_type", Schema);

    model.insert_device_type = function (system, systemName, group, groupName, id, name, desc, pointList, config, time, callback) {
        model.collection.insertOne({
            _id: format_key(system, group, id),
            system: system,
            systemName: systemName,
            group: group,
            groupName: groupName,
            id: id,
            name: name,
            desc: desc,
            pointList: pointList,
            config: config,
            time: time
        }, callback);
    };

    model.upsert_device_type = function (system, systemName, group, groupName, id, name, desc, pointList, config, time, callback) {
        model.update({system: system, group: group, id: id}, {$set: {systemName: systemName, groupName: groupName, name: name, desc: desc, pointList: pointList, config: config, time: time}}, {upsert: true}, callback);
    };

    model.update_device_type = function (param, option, callback) {
        model.update(param, {$set: option}, callback);
    };

    model.remove_device_type = function (system, group, id, callback) {
        model.remove({system: system, group: group, id: id}, callback)
    };

    model.clear_device_type = function (callback) {
        model.remove({}, callback);
    };

    model.find_device_type = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};