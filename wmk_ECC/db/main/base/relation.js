/**
 * Created by wangxh on 2017/3/24.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: String,
    serverNO: Number,
    classID: Number,
    id: Number,
    childServerNO: Number,
    childClassID: Number,
    childID: Number
},{collection: "relation", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("relation", Schema);

    model.insert_relation = function (serverNO, classID, id, childServerNO, childClassID, childID, callback) {
        var _id = format_key(serverNO, classID, id, childServerNO, childClassID, childID);
        var setpro = {serverNO: serverNO,
            classID: classID,
            id: id,
            childServerNO: childServerNO,
            childClassID: childClassID,
            childID: childID
        };
        model.update({_id: _id}, {$set: setpro}, {upsert: true}, callback);
    };

    model.update_relation = function (param, option, callback) {
        model.update(param, {$set: option}, callback);
    };

    model.delete_relation = function (serverNO, classID, id, callback) {
        model.remove({$or: [{serverNO: serverNO, classID: classID, id: id}, {childServerNO: serverNO, childClassID: classID, childID: id}]}, callback);
    };

    model.clear_no_relation = function (param, callback) {
        model.remove(param, callback);
    };

    model.find_relation = function (param, fields, callback) {
        model.find(param, fields, callback);
    };

    return model;
};