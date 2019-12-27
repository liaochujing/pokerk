/**
 * Created by wangxh on 2018/4/19.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: String,
    path: String,
    content: String,
    time: Date
}, {collection: "config_file", versionKey: false});

module.exports = function (conn) {
    var model = conn.model('config_file', Schema);

    model.insert_config_file = function (name, path, content, time, callback) {
        model.update({_id: name}, {$set: {path: path, content: content, time: time}}, {upsert: true}, callback);
    };
    
    model.remove_config_file = function (name, callback) {
        model.remove({_id: name}, callback)
    };

    model.get_config_file = function (name, callback) {
        model.findOne({_id: name}, {}, function (err, record) {
            if(err) return callback(err);
            callback(null, record);
        })
    };

    model.find_config_file = function (param, fields, callback) {
        model.remove(param, fields, callback)
    };

    return model;
};