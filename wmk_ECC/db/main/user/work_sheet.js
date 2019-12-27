/**
 * Created by wangxh on 2017/11/9.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: Number,
    serverNO: Number,
    classID: Number,
    id: Number,
    sheetID: Number,
    title: String,
    content: Object,
    description: String,
    operationList: Object,
    state: Number,
    createTime: Date,
    finishTime: Date
},{collection: "work_sheet", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("work_sheet", Schema);

    model.insert_work_sheet = function (serverNO, classID, id, sheetID, title, content, description, operation, state, time, callback) {
        model.collection.insertOne({
            _id: sheetID,
            serverNO: serverNO,
            classID: classID,
            id: id,
            sheetID: sheetID,
            title: title,
            content: content,
            description: description,
            operationList: [operation],
            state: state,
            createTime: time
        }, callback);
    };

    model.update_work_sheet = function (sheetID, title, content, description, operation, callback) {
        model.update({sheetID: sheetID}, {$set: {title: title, content: content, description: description}, $addToSet: {operationList: operation}}, callback)
    };

    model.finish_work_sheet = function (sheetID, state, operation, time, callback) {
        model.update({sheetID: sheetID}, {$set: {state: state, finishTime: time}, $addToSet: {operationList: operation}}, callback)
    };

    model.find_work_sheet = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};