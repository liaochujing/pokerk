/**
 * Created by wangxh on 2017/9/26.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: String,  //            _id: format_key(serverNO, classID, id),
    serverNO: Number,
    classID: Number,
    id: Number,
    alarm_notify_config: Array,
    schedule_alarm_config: Object,
    alarm_notify_rule_config:Object

    // condition: Object,
    // option: Object,
    // config: Object,
    // time: Date,
},{collection: "area_alarm_config", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("area_alarm_config", Schema);

    // model.insert_alarm_type = function (id, name, condition, option, config, time, callback) {
    //     model.collection.insertOne({_id: id, id: id, name: name, condition: condition, option: option, config: config, time: time}, callback);
    // };
    model.find_all_area_config= function(callback){
        return model.find({},{},callback);
    };

    model.upsert_alarm_config = function (area, config, callback) {
        area['_id'] = format_key(area.serverNO,area.classID,area.id);
        model.update(area, {$set: config}, {upsert: true}, callback);
    };

    // model.remove_alarm_type = function (id, callback) {
    //     model.remove({id: id}, callback);
    // };
    //
    // model.clear_alarm_type = function (callback) {
    //     model.remove({}, callback);
    // };
    //
    model.find_area_alarm_config = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};