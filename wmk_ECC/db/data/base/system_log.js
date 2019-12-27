/**
 * Created by wangxh on 2017/12/28.
 */

'use strict';

var logger = require('../../../util/log_manager').logger;
var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    module: Number,
    type: Number,
    desc: String,
    data: Object,
    time: Date
},{collection: "system_log", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("system_log", Schema);
    
    model.insert_sys_log = function (type, desc, data, time) {
        model.collection.insertOne({
            module: svrType,
            type: type,
            desc: desc,
            data: data,
            time: time
        }, function (err) {
            if(err){
                logger.error({msg: 'insert sys log failed', type: type, desc: desc, data: data, time: time, err: err});   
            }
        });
    };

    model.find_sys_log = function (param, fields, callback) {
        model.collection.find(param, fields).toArray(callback);
    };

    return model;
};