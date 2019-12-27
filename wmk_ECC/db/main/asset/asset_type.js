/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var mongoose = require('mongoose');

var Schema = new mongoose.Schema({
    _id: String,
    system: Number,
    name: String,
    groups: Object,//[{group: 0, name: '', desc: ''}]
    desc: String
},{collection: "asset_type", versionKey: false});

module.exports = function (conn) {
    var model = conn.model("asset_type", Schema);

    model.insert_asset_type = function (system, name, groups, desc, callback) {
        model.collection.insertOne({
            _id: system,
            system: system,
            groups: groups,
            name: name,
            desc: desc
        }, callback);
    };

    model.clear_asset_type = function (callback) {
        model.remove({}, callback);
    };

    model.find_asset_type = function (param, fields, callback) {
        return model.find(param, fields, callback);
    };

    return model;
};