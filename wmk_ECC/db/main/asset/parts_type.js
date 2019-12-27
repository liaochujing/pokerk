/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var mongoose = require('mongoose');

var AssetSchema = new mongoose.Schema({
    _id: Number,
    id: Number,
    name: String,
    desc: String,
    createTime: Date,//创建时间
    modifyTime: Date//修改时间
},{collection: "parts_type", versionKey: false});

module.exports = function (conn) {
    var _model = conn.model("parts_type", AssetSchema);

    _model.insert_parts_type = function (id, name, desc, createTime, callback) {
        _model.collection.insertOne({
            _id: id,
            id: id,
            name: name,
            desc: desc,
            modifyTime: createTime,
            createTime: createTime
        }, callback)
    };

    _model.update_parts_type = function (id, name, desc, modifyTime, callback) {
        _model.update({_id: id}, {$set: {name: name, desc: desc, modifyTime: modifyTime}}, callback)
    };

    _model.remove_parts_type = function (id, callback) {
        _model.remove({_id: id}, callback)
    };

    _model.find_parts_type = function (param, fields, callback) {
        return _model.find(param, fields, callback);
    };

    return _model;
};