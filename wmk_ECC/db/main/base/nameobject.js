/**
 * Created by wangxh on 2017/3/24.
 */

'use strict';

var mongoose = require('mongoose');

var NameObjectSchema = new mongoose.Schema({
    _id: String,
    serverNO: Number,
    classID: Number,
    id: Number,
    fullName: String,
    name: String,
    description: String,
    restData: Object,
    createTime: Date,
    modifyTime: Date
},{collection: "nameobject", versionKey: false});

var NameObjectConfigSchema = new mongoose.Schema({
    serverNO: Number,
    classID: Number,
    id: Number,
    key: String,//键
    value: Object//数据
},{collection: "nameobject_config", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("nameobject", NameObjectSchema);
    var config_model = conn.model("nameobject_config", NameObjectConfigSchema);

    model.update_nameobject_config = function (serverNO, classID, id, key, value, callback) {
        config_model.collection.findAndModify({serverNO: serverNO, classID: classID, id: id, key: key}, false, {serverNO: serverNO, classID: classID, id: id, key: key, value : value},{new : true, upsert : true}, callback);
    };

    model.remove_nameobject_config = function (serverNO, classID, id, key, callback) {
        config_model.collection.remove({serverNO: serverNO, classID: classID, id: id, key: key}, callback);
    };

    model.find_nameobject_config = function (param, fields, callback) {
        config_model.find(param, fields, callback);
    };

    model.insert_nameobject = function (serverNO, classID, id, fullName, name, restData, description, createTime, modifyTime, callback) {
        model.collection.insertOne({
            _id: format_key(serverNO, classID, id),
            serverNO: serverNO,
            classID: classID,
            id: id,
            fullName: fullName,
            name: name,
            restData: restData,
            description: description,
            createTime: createTime,
            modifyTime: modifyTime
        }, callback);
    };

    model.upsert_nameobject = function (serverNO, classID, id, fullName, name, restData, description, createTime, modifyTime, callback) {
        var _id = format_key(serverNO, classID, id);
        var setpro = {serverNO: serverNO, classID: classID, id: id, fullName: fullName, name: name, restData: restData, createTime: createTime, modifyTime: modifyTime};
        if(description){
            setpro.description = description;
        }
        model.update({_id: _id}, {$set: setpro}, {upsert: true}, callback);
    };

    model.update_nameobject_time = function (serverNO, classID, id, time, callback) {
        model.update({serverNO: serverNO, classID: classID, id: id}, {$set: {modifyTime: time}}, callback)
    };

    model.update_nameobject = function (param, option, callback) {
        model.update(param, {$set: option}, callback)
    };

    model.delete_nameobject = function (serverNO, classID, id, callback) {
        model.remove({serverNO: serverNO, classID: classID, id: id}, function (err) {
            if(err) return callback(err);
            config_model.remove({serverNO: serverNO, classID: classID, id: id}, callback);
        });
    };

    model.clear_nameobject = function (param, callback) {
        model.remove(param, function (err) {
            if(err) return callback(callback);

            config_model.remove(param, callback);
        });
    };

    model.find_nameobject = function (param, fields, callback) {
        if(callback){
            return model.find(param, fields, callback);
        }else{
            return model.collection.find(param, fields);
        }

    };

    model.find_all_nameobject = function (param, cbPage, cbFinal) {
        var fields = {};
        if(param){
            fields = param;
        }
        model.count({}, function (err, count) {
            if(err) return cbFinal(err);
            var totalCount = count;
            var from = 0;
            var pageCount = 10000;

            function find_page() {
                model.collection.find({}, fields).skip(from).limit(pageCount).toArray(function (err, data) {
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