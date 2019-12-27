/**
 * Created by wangxh on 2017/11/13.
 */

'use strict';

// var mongoose = require('mongoose');
//
// var Schema = new mongoose.Schema({
//     serverNO: Number,
//     classID: Number,
//     id: Number,
//     module: Number,
//     action: Number,
//     data: Object,
//     time: Date
// },{collection: "operator_log", versionKey: false});
//
// module.exports = function (conn) {
//     var model = conn.model("operator_log", Schema);
//
//     var module = svrType;//当前模块
//     model.insert_log = function (serverNO, classID, id, action, data, time, callback) {
//         model.collection.insertOne({
//             serverNO: serverNO,
//             classID: classID,
//             id: id,
//             module: module,
//             action: action,
//             data: data,
//             time: time
//         }, callback);
//     };
//
//     model.find_log = function (param, fields, callback) {
//         model.collection.find(param, fields).toArray(callback);
//     };
//
//     return model;
// };

var logger = require('../../../util/log_manager').logger;
var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    module: Number,
    type: Number,
    desc: String,
    user: Object,
    data: Object,
    time: Date
},{collection: "user_operator_log", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("user_operator_log", Schema);

    model.insert_user_log = function (type, user, desc, data, time) {
        var _user = undefined;
        if(!user){
            _user = {name: '未知用户'};
        }else{
            _user = {serverNO: user.serverNO, classID: user.classID, id: user.id, name: user.name, ip: user.ip};
        }
        model.collection.insertOne({
            module: svrType,
            type: type,
            user: _user,
            desc: desc,
            data: data,
            time: time
        }, function (err) {
            if(err){
                logger.error({msg: 'insert user log failed', type: type, user: user, desc: desc, data: data, time: time, err: err});
            }
        });
    };

    model.find_user_log = function (param, fields, callback) {
        model.collection.find(param, fields).toArray(callback);
    };

    return model;
};