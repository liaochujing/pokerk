/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: String,
    serverNO: Number,
    classID: Number,
    id: Number,
    region: Object,
    name: String,
    fullName: String,
    level: Number,
    sponsor: Object,
    recipient: Object,
    group: Number,
    step: Number,
    state: Number,
    restData: Object,
    operationList: Object,
    attachmentList: Object,
    startTime: Date,
    createTime: Date,
    sendTime: Date,
    endTime: Date,
    receiveTime: Date,
    users: Object,
    notifyInfo: Object,
    tempData: Object
},{collection: "order", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("order", Schema);

    model.insert_order = function (serverNO, classID, id, region, name, fullName, level, sponsor, recipient, group, step, state, restData, operationList, users, createTime, sendTime, startTime, callback) {
        var record = {
            _id: format_key(serverNO, classID, id),
            serverNO:  serverNO,
            classID: classID,
            id: id,
            region: region,
            name: name,
            fullName: fullName,
            level: level,
            sponsor: sponsor,
            recipient: recipient,
            group: group,
            step: step,
            state: state,
            restData: restData,
            operationList: operationList,
            users: users,
            createTime: createTime,
            sendTime: sendTime,
            startTime: startTime
        };
        model.collection.insertOne(record, callback);
    };

    model.update_order = function (serverNO, classID, id, region, name, fullName, level, sponsor, recipient, group, step, state, restData, callback) {
        var setpro = {
            region: region,
            name: name,
            fullName: fullName,
            level: level,
            sponsor: sponsor,
            recipient: recipient,
            step: step,
            state: state,
            restData: restData
        };
        if(group){
            setpro.group = group;
        }

        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: setpro}, callback);
    };
    
    model.update_alarm_order = function (serverNO, classID, id, endTime, callback) {
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: {'restData.endTime': endTime}}, callback);
    };

    model.update_order_data = function (serverNO, classID, id, update, callback) {
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, update, callback);
    };

    model.send_order = function (serverNO, classID, id, step, state, recipient, sponsor, time, operation, callback) {
        var addPro = {users: {$each: [sponsor, recipient]}, operationList: operation};
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: {step: step, state: state, sendTime: time, startTime: time}, $addToSet: addPro}, callback)
    };

    model.receive_order = function (serverNO, classID, id, state, recipient, time, operation, callback) {
        var setpro = {state: state, recipient: recipient, receiveTime: time};
        var addpro = {operationList: operation, users: recipient};
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: setpro, $addToSet: addpro, $unset: {tempData: 1, 'notifyInfo.handle': 1}}, callback)
    };
    
    model.rollback_order = function (serverNO, classID, id, step, state, recipient, time, operation, callback) {
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: {step: step, state: state, recipient: recipient, sendTime: time}, $addToSet: {operationList: operation}, $unset: {receiveTime: 1, tempData: 1, 'notifyInfo.receive': 1}}, callback)
    };
    
    model.handle_order = function (serverNO, classID, id, step, state, recipient, time, operation, callback) {
        var addPro = {users: recipient, operationList: operation};
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: {step: step, state: state, recipient: recipient, sendTime: time}, $addToSet: addPro, $unset: {receiveTime: 1, tempData: 1, 'notifyInfo.receive': 1}}, callback)
    };
    
    model.finish_order = function (serverNO, classID, id, state, recipient, time, operation, callback) {
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: {state: state, recipient: recipient, endTime: time}, $addToSet: {operationList: operation}, $unset: {receiveTime: 1, sendTime: 1, tempData: 1}}, callback)
    };
    
    model.save_temp_data = function (serverNO, classID, id, tempData, callback) {
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: {tempData: tempData}}, callback)
    };

    model.update_notify_tag = function (serverNO, classID, id, tag, data, callback) {
        var _tag = {};
        _tag['notifyInfo.' + tag] = data;
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$set: _tag}, callback)
    };

    model.add_attachment = function (serverNO, classID, id, attachments, callback) {
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$addToSet: {attachmentList: {$each: attachments}}}, callback);
    };

    model.remove_attachment = function (serverNO, classID, id, attachmentID, callback) {
        model.collection.update({serverNO: serverNO, classID: classID, id: id}, {$pull: {attachmentList: {id: attachmentID}}}, callback);
    };

    model.find_order = function (param, fields, callback) {
        if(callback){
            model.collection.find(param, fields).toArray(callback);
        }else{
            return model.collection.find(param, fields);
        }
    };

    return model;
};