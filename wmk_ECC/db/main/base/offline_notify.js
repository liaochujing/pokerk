/**
 * Created by wangxh on 2018/1/9.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    type: Number,
    msg: Object,
    time: Date
},{collection: "offline_notify", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("offline_notify", Schema);

    model.insert_offline_notify = function (types, msg, time, callback) {
        var len = types.length;
        if(len > 0){
            if(len > 1){
                var _list = [];
                for(var i=0;i<len;i++){
                    _list.push({type: types[i], msg: msg, time: time});
                }
                model.insert(_list, callback);
            }else{
                model.collection.insertOne({type: types[0], msg: msg, time: time}, callback);
            }
        }else{
            callback();
        }
    };

    model.find_offline_notify = function (type, callback) {
        return model.find({type: type}, {}, callback);
    };

    model.remove_offline_notify = function (params, callback) {
        model.remove(params, callback);
    };

    return model;
};