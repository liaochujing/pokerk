/**
 * Created by wangxh on 2017/10/12.
 */

'use strict';

var mongoose = require('mongoose');

var SystemConfigSchema = new mongoose.Schema({
    _id :   String,   //键
    system: Number,
    key: String,
    value :  Object    //数据
},{collection: "system_config", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("system_config", SystemConfigSchema);

    model.update_system_config = function (system, key, value, callback) {
        var _id = format_key(system, key);
        model.collection.findAndModify({_id : _id}, false, {_id : _id, system: system, key: key, value : value},{new : true, upsert : true}, callback);
    };

    model.clear_system_config = function (callback) {
        model.remove({}, callback)
    };
    
    model.find_system_config = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};