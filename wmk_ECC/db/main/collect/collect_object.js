/**
 * Created by wangxh on 2017/10/18.
 */

'use strict';

var mongoose = require('mongoose');

var DeviceSchema = new mongoose.Schema({
    _id: String,
    serverNO: Number,
    classID: Number,
    id: Number,
    fullName: String,
    description: String,
    restData: Object,
    createTime: Date,
    modifyTime: Date
},{collection: "collect_object", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("collect_object", DeviceSchema);

    model.insert_collect_object = function (serverNO, classID, id, fullName, restData, description, createTime, modifyTime, callback) {
        model.collection.insertOne({
            _id: format_key(serverNO, classID, id),
            serverNO: serverNO,
            classID: classID,
            id: id,
            fullName: fullName,
            restData: restData,
            description: description,
            createTime: createTime,
            modifyTime: modifyTime
        }, callback);
    };

    model.update_collect_object = function (serverNO, classID, id, fullName, restData, description, modifyTime, callback) {
        model.update({serverNO: serverNO, classID: classID, id: id}, {$set: {fullName: fullName, restData: restData, description: description, modifyTime: modifyTime}}, callback);
    };

    model.upsert_collect_object = function (serverNO, classID, id, fullName, restData, description, createTime, modifyTime, callback) {
        var _id = format_key(serverNO, classID, id);
        model.update({_id: _id}, {$set: {serverNO: serverNO, classID: classID, id: id, fullName: fullName, description: description, restData: restData, createTime: createTime, modifyTime: modifyTime}}, {upsert: true}, callback);
    };

    model.update_collect_bject_time = function (serverNO, classID, id, time, callback) {
        model.update({serverNO: serverNO, classID: classID, id: id}, {$set: {modifyTime: time}}, callback)
    };

    model.delete_collect_object = function (serverNO, classID, id, callback) {
        model.remove({serverNO: serverNO, classID: classID, id: id}, callback);
    };

    model.clear_collect_object = function (param, callback) {
        model.remove(param, callback);
    };

    model.find_collect_object = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};