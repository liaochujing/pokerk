/**
 * Created by wangxh on 2017/10/18.
 */

'use strict';

var ObjectState = require('../../../definition/object_state');
var mongoose = require('mongoose');

var OperatorGroupSchema = new mongoose.Schema({
    _id: String,
    serverNO: Number,
    classID: Number,
    id: Number,
    fullName: String,
    description: String,
    restData: Object,
    modifyTime: Date,
    createTime: Date,
    _state: Number
},{collection: "operator_object", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("operator_object", OperatorGroupSchema);

    model.insert_operator_object = function (serverNO, classID, id, fullName, description, restData, createTime, callback) {
        model.collection.insertOne({
            _id: format_key(serverNO, classID, id),
            serverNO: serverNO,
            classID: classID,
            id: id,
            fullName: fullName,
            description: description,
            restData: restData,
            modifyTime: createTime,
            createTime: createTime
        }, callback);
    };

    model.upsert_operator_object = function (serverNO, classID, id, fullName, restData, description, createTime, modifyTime, callback) {
        var _id = format_key(serverNO, classID, id);
        model.update({_id: _id}, {$set: {serverNO: serverNO, classID: classID, id: id, fullName: fullName, description: description, restData: restData, createTime: createTime, modifyTime: modifyTime}}, {upsert: true}, callback);
    };

    model.delete_operator_object = function (serverNO, classID, id, callback) {
        model.update({serverNO: serverNO, classID: classID, id: id}, {$set: {_state: ObjectState.deleted}}, callback);
    };

    model.update_state = function (serverNO, classID, id, state, callback) {
        model.update({serverNO: serverNO, classID: classID, id: id}, {$set: {'restData.state': state}}, callback)
    };

    model.clear_operator_object = function (param, callback) {
        model.remove(param, callback);
    };

    model.find_operator_object = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};