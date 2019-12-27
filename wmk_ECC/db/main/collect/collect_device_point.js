/**
 * Created by wangxh on 2017/11/24.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    serverNO: Number,
    classID: Number,
    id: Number,
    pointIndex: Number,
    pointType: Number,
    name: String,
    unit: String,
    desc: String,
    config: Object,
    time: Date
},{collection: "collect_device_point", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("collect_device_point", Schema);

    model.insert_collect_device_point = function (serverNO, classID, id, points, time, callback) {
        if(!points || points.length <= 0){
            callback();
            return;
        }
        var _points = [];

        for(var i=0;i<points.length;i++){
            var _point = points[i];

            var _time = time;
            if(_point.time){
                _time = new Date(_point.time);
            }
            _points.push({
                serverNO: serverNO,
                classID: classID,
                id: id,

                pointIndex: _point.pointIndex,
                pointType: _point.pointType,
                name: _point.name,
                unit: _point.unit,
                desc: _point.desc,

                config: _point.config,
                option: _point.option,

                time: _time
            })
        }

        model.collection.insert(_points, callback);
    };

    model.clear_collect_device_point = function (serverNO, classID, id, callback) {
        model.remove({serverNO: serverNO, classID: classID, id: id}, callback)
    };

    model.find_collect_device_point = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};