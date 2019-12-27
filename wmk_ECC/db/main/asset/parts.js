/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var mongoose = require('mongoose');

var AssetSchema = new mongoose.Schema({
    _id: Number,
    id: Number,
    type: Number,
    name: String,
    brand: String,
    model: String,
    supplier: Number,
    state: Number,
    _state: Number,
    aNO: String,//资产编号(使用的)
    option: Object,
    createTime: Date,//创建时间
    modifyTime: Date//修改时间
},{collection: "parts", versionKey: false});

module.exports = function (conn) {
    var _model = conn.model("parts", AssetSchema);

    _model.insert_parts = function (id, type, name, brand, model, supplier, state, option, createTime, callback) {
        _model.collection.insertOne({
            _id: id,
            id: id,
            type: type,
            name: name,
            brand: brand,
            model: model,
            supplier: supplier,
            state: state,
            option: option,
            modifyTime: createTime,
            createTime: createTime
        }, callback)
    };

    _model.update_parts = function (id, type, name, brand, model, supplier, state, option, modifyTime, callback) {
        var setpro = {modifyTime: modifyTime};

        if(type != undefined){
            setpro.type = type;
        }
        if(name != undefined){
            setpro.name = name;
        }
        if(brand != undefined){
            setpro.brand = brand;
        }
        if(model != undefined){
            setpro.model = model;
        }
        if(supplier != undefined){
            setpro.supplier = supplier;
        }
        if(state != undefined){
            setpro.state = state;
        }
        if(option != undefined){
            setpro.option = option;
        }

        _model.update({_id: id}, {$set: setpro}, callback)
    };

    _model.set_parts_asset = function (id, state, aNO, callback) {
        _model.update({_id: id, state: {$ne: state}}, {$set: {aNO: aNO, state: state}}, callback)
    };

    _model.update_part_state = function (id, state, callback) {
        _model.update({_id: id}, {$set: {_state: state}}, callback);
    };

    _model.find_parts = function (param, fields, callback) {
        return _model.find(param, fields, callback);
    };

    return _model;
};