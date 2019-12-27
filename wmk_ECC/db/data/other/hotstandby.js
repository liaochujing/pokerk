/**
 * Created by wangxh on 2018/4/23.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    currenthost: String,
    currentip: String,
    createtime: Date
},{collection: "hotstandby", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("hotstandby", Schema);

    model.find_hotstandby = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};