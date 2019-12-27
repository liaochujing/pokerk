/**
 * Created by wangxh on 2017/11/3.
 */

'use strict';

var mongoose = require('mongoose');

var AssetSchema = new mongoose.Schema({
    _id: Number,
    name: String,
},{collection: "attribute", versionKey: false});

module.exports = function (conn) {
    var _model = conn.model("attribute", AssetSchema);

    _model.insert_attribute = function (id, name, callback) {
        _model.collection.insertOne({_id: id, name: name}, callback)
    };

    _model.update_attribute = function (id, name, callback) {
        _model.update({_id: id}, {$set: {name: name}}, callback)
    };

    _model.delete_attribute = function (id, callback) {
        _model.remove({_id: id}, callback)
    };

    _model.find_attribute = function (param, fields, callback) {
        return _model.find(param, fields, callback);
    };

    return _model;
};