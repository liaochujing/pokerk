/**
 * Created by wangxh on 2017/11/9.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: Number,
    id: Number,
    type: Number,
    name: Object,
    option: Object,
    time: Date
},{collection: "role", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("role", Schema);

    model.insert_role = function (id, type, name, option, callback) {
        model.collection.insertOne({
            _id: id,
            id: id,
            type: type,
            name: name,
            option: option,
            time: new Date()
        }, callback);
    };

    model.update_role = function (id, update, callback) {
        model.update({_id: id}, update, callback);
    };

    model.find_role = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    model.clear_role = function (callback) {
        model.remove({}, callback);
    };

    model.delete_role = function (id, callback) {
        model.remove({_id: id}, callback);
    };

    model.update_privilegeList = function (id, privilegeList, time, callback) {
        model.update({_id: id}, {$set:{'option.privilegeList': privilegeList, time: time}}, callback);
    };

    return model;
};