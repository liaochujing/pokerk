/**
 * Created by wangxh on 2017/11/16.
 */

'use strict';


var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: Number,
    id: Number,
    name: String,
    desc: String,
    points: Object
},{collection: "privilege", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("privilege", Schema);

    model.insert_privilege = function (id, name, desc, points, callback) {
        model.collection.insertOne({_id: id, id: id, name: name, desc: desc, points: points}, callback);
    };

    model.clear_privilege = function (callback) {
        model.remove({}, callback);
    };

    model.find_privilege = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};