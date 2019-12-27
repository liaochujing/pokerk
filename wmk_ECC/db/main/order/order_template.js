/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    id: Number,
    name: String,
    desc: String,
    data: Object
},{collection: "order_template", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("order_template", Schema);

    model.insert_order_template = function (id, name, desc, data, callback) {
        model.collection.insertOne({id: id, name: name, desc: desc, data: data}, callback);
    };

    model.update_order_template = function (id, name, desc, data, callback) {
        model.collection.update({id: id}, {$set: {name: name, desc: desc, data: data}}, callback);
    };

    model.remove_order_template = function (id, callback) {
        model.collection.remove({id: id}, callback);
    };

    model.find_order_template = function (param, fields, callback) {
        model.collection.find(param, fields).toArray(callback);
    };

    return model;
};