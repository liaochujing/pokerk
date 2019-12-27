/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: Number,
    id: Number,
    filename: String,
    data: String
}, {collection: "attachment", versionKey: false});

module.exports = function (conn) {
    var model = conn.model('attachment', Schema);

    model.insert_attachment = function (id, filename, data, callback) {
        model.collection.insertOne({
            _id: id,
            id: id,
            filename: filename,
            data: data
        }, callback)
    };

    model.get_attachment = function (id, callback) {
        model.findOne({id: id}, {_id: 0, filename: 1, data: 1}, function (err, record) {
            if(err) return callback(err);
            callback(null, record);
        })
    };

    model.remove_attachment = function (id, callback) {
        model.remove({id: id}, callback)
    };

    return model;
};