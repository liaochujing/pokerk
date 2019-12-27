/**
 * Created by wangxh on 2017/11/14.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: Number,
    id: Number,
    type: Number,
    cmd: String,
    name: String,
    desc: String,
    config: Object,
    areaID:String
},{collection: "report_template", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("report_template", Schema);

    model.insert_report_template = function (id, type, cmd, name, desc, config, areaID, callback) {
        model.collection.insertOne({_id: id, id: id, type: type, cmd: cmd, name: name, desc: desc, config: config, areaID: areaID}, callback);
    };

    model.update_report_template = function (id, name, desc, config, callback) {
        model.update({id: id}, {$set: {name: name, desc: desc, config: config}}, callback);
    };

    model.remove_report_template = function (id, callback) {
        model.remove({id: id}, callback);
    };

    model.find_report_template = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};