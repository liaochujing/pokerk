/**
 * Created by wangxh on 2019/2/26.
 */

'use strict';

var logger = require('../../../util/log_manager').logger;
var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    link_id: Number,
    msg: String,
    data: Object,
    time: Date
},{collection: "link_control_log", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("link_control_log", Schema);

    model.insert_link_control_log = function (link_id, msg, data, time) {
        model.collection.insertOne({
            link_id: link_id,
            msg: msg,
            data: data,
            time: time
        }, function (err) {
            if(err){
                logger.error({msg: 'insert link control log failed', link_id: link_id, data: data, time: time, err: err});
            }
        });
    };

    model.find_link_control_log = function (param, fields, callback) {
        model.collection.find(param, fields).toArray(callback);
    };

    return model;
};