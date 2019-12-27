/**
 * Created by wangxh on 2017/3/24.
 */

'use strict';

var mongoose = require('mongoose');

var DevicePointSchema = new mongoose.Schema({
    serverNO: Number,
    classID: Number,
    id: Number,
    deviceServerNO: Number,
    deviceClassID: Number,
    deviceID: Number,
    childID: Number,//子设备id
    pointIndex: Number,
    pointType: Number,
    fullName: String,
    unit: String,
    description: String,
    binding: Object,
    config: Object,
    option: Object,
    restData: Object,
    createTime: Date,
    modifyTime: Date
},{collection: "devicepoint", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("devicepoint", DevicePointSchema);

    model.batch_insert_devicepoint = function (pointList, callback) {
        var _devicePointList = [];

        for(var i=0;i<pointList.length;i++){
            var _point = pointList[i];

            _devicePointList.push({
                serverNO: _point.serverNO,
                classID: _point.classID,
                id: _point.id,
                deviceServerNO: _point.deviceServerNO,
                deviceClassID: _point.deviceClassID,
                deviceID: _point.deviceID,
                pointIndex: _point.pointIndex,
                pointType: _point.pointType,
                fullName: _point.fullName,
                unit: _point.unit,
                config: _point.config,
                option: _point.option,
                binding: _point.binding,
                restData: _point.restData,
                description: _point.description,
                createTime: _point.createTime,
                modifyTime: _point.modifyTime
            })
        }

        model.collection.insert(_devicePointList, callback);
    };

    model.update_devicepoint_data = function (serverNO, classID, id, points, callback) {
        var options = [];

        for(var i=0;i<points.length;i++){
            var item = points[i];
            var setpro = {};

            if(item.config){
                setpro.config = item.config;
            }
            if(item.option){
                setpro.option = item.option;
            }
            if(item.time){
                setpro.modifyTime = new Date(item.time);
            }

            options.push({updateOne: {filter: {deviceServerNO: serverNO, deviceClassID: classID, deviceID: id, pointIndex: item.pointIndex}, update: {$set: setpro}}});
        }

        model.collection.bulkWrite(options, callback);
    };

    model.update_devicepoint_binding_list = function (serverNO, classID, id, points, callback) {
        var options = [];
        
        for(var i=0;i<points.length;i++){
            var item = points[i];
            var setpro = {binding: item.binding};
            if(item.time){
                setpro.modifyTime = new Date(item.time);
            }
            options.push({updateOne: {filter: {deviceServerNO: serverNO, deviceClassID: classID, deviceID: id, pointIndex: item.pointIndex}, update: {$set: setpro}}});
        }

        model.collection.bulkWrite(options, callback);
    };

    model.update_devicepoint_config = function (serverNO, classID, id, pointIndex, config, time, callback) {
        model.update({deviceServerNO: serverNO, deviceClassID: classID, deviceID: id, pointIndex: pointIndex}, {$set: {config: config, modifyTime: time}}, callback);
    };

    model.update_devicepoint_data_list = function (serverNO, classID, id, points, callback) {
        if(!points || points.length <=0){
            callback();
            return;
        }

        var options = [];
        for(var i=0;i<points.length;i++){
            var item = points[i];
            var setpro = {};
            if(item.config !== undefined){
                setpro.config = item.config;
            }
            if(item.option !== undefined){
                setpro.option = item.option;
            }
            if(item.binding !== undefined){
                setpro.binding = item.binding;
            }
            if(item.time){
                setpro.modifyTime = new Date(item.time);
            }

            options.push({updateOne: {filter: {deviceServerNO: serverNO, deviceClassID: classID, deviceID: id, pointIndex: item.pointIndex}, update: {$set: setpro}}});
        }

        model.collection.bulkWrite(options, callback);
    };

    model.update_devicepoint = function (param, option, callback) {
        model.collection.update(param, {$set: option}, {upsert : false, multi: true}, callback);
    };

    model.clear_devicepoint = function (param, callback) {
        model.remove(param, callback);
    };

    model.find_point_by_device = function (identity, fields, callback) {
        model.collection.find({deviceServerNO: identity.serverNO, deviceClassID: identity.classID, deviceID: identity.id}, fields).toArray(callback);
    };

    model.find_device_point = function (param, fields, callback) {
        return model.collection.find(param, fields).toArray(callback);
    };

    model.find_point = function (param, fields, cbPage, cbFinal) {
        model.count(param, function (err, count) {
            if(err) return cbFinal(err);
            var totalCount = count;
            var from = 0;
            var pageCount = 50000;

            function find_page() {
                model.collection.find(param, fields).skip(from).limit(pageCount).toArray(function (err, data) {
                    if(err) return cbFinal(err);
                    from+=pageCount;
                    if(data && data.length > 0){
                        cbPage(data);
                    }
                    data.length = 0;
                    data = null;
                    if(from >= totalCount){
                        cbFinal();
                    }else{
                        find_page();
                    }
                })
            }

            find_page();
        });
    };

    return model;
};