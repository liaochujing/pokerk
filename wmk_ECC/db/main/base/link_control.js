/**
 * Created by wangxh on 2018/12/21.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    id: Number,
    type: Number,
    name: String,
    option: Object,
    enabled: Number,
    time: Date
}, {collection: "link_control", versionKey: false});

module.exports = function (conn) {
    var model = conn.model('link_control', Schema);

    model.insert_link_control = function (id, type, name, option, enabled, time, callback) {
        model.collection.insertOne({id: id, type: type, name: name, option: option, enabled: enabled, time: time}, callback)
    };

    model.update_link_control = function (id, type, name, option, enabled, time, callback) {
        model.collection.update({id: id}, {$set: {type: type, name: name, option: option, enabled: enabled, time: time}}, callback)
    };

    model.delete_link_control = function (id, callback) {
        model.collection.remove({id: id}, callback)
    };

    model.clear_link_control = function (param, callback) {
        model.collection.remove(param, callback)
    };

    model.find_link_control = function (param, fields, callback) {
        model.collection.find(param, fields).toArray(callback);
    };

    return model;
};