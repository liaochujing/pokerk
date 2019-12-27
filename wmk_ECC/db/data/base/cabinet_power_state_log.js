/**
 * Created by wangxh on 2018/3/6.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    serverNO: Number,
    classID: Number,
    id: Number,
    areaID: Number,
    start: Date,
    end: Date
},{collection: "cabinet_power_state_log", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("cabinet_power_state_log", Schema);

    model.insert_log = function (serverNO, classID, id, areaID, start, end, callback) {
        model.collection.insertOne({
            serverNO: serverNO,
            classID: classID,
            id: id,
            areaID: areaID,
            start: start,
            end: end
        }, callback);
    };

    model.find_log = function (param, fields, callback) {
        model.collection.find(param, fields).toArray(callback);
    };

    return model;
};