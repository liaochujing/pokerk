/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var mongoose = require('mongoose');

var AssetSchema = new mongoose.Schema({
    _id: String,
    aNO: String,//编号
    name: String,
    model: String,
    type: Object,
    ratedPower: Number,
    brand: String,
    supplier: Number,
    mcycle: Number,
    ucycle: Number,
    wlife: Date,
    purDate: Date,
    pdDate: Date,
    stDate: Date,
    // uuDate: Date,//停用日期
    region: Object,
    state: Number,
    _state: Number,//是否删除
    option: Object,//自定义属性
    lmDate: Date,       //最后维护日期
    createTime: Date,//创建时间
    modifyTime: Date//修改时间
},{collection: "asset", versionKey: false});

module.exports = function (conn) {
    var _model = conn.model("asset", AssetSchema);

    _model.insert_asset = function (aNO, name, model, type, ratedPower, brand, supplier, mcycle, ucycle, wlife, purDate, pdDate, stDate, region, state, option, createTime, callback) {
        _model.collection.findAndModify({_id: aNO}, false, {
                aNO: aNO,
                name: name,
                model: model,
                type: type,
                ratedPower: ratedPower,
                brand: brand,
                supplier: supplier,
                mcycle: mcycle,
                ucycle: ucycle,
                wlife: wlife,
                purDate: purDate,
                pdDate: pdDate,
                stDate: stDate,
                region: region,
                state: state,
                _state: 0,
                option: option,
                modifyTime: createTime,
                createTime: createTime},
            {new : true, upsert : true}, callback);
    };

    _model.update_asset = function (aNO, name, model, type, ratedPower, brand, supplier, mcycle, ucycle, wlife, purDate, pdDate, stDate, region, option, modifyTime, callback) {
        var setpro = {modifyTime: modifyTime};

        if(name !== undefined){
            setpro.name = name;
        }
        if(model !== undefined){
            setpro.model = model;
        }
        if(type !== undefined){
            setpro.type = type;
        }
        if(ratedPower !== undefined){
            setpro.ratedPower = ratedPower;
        }
        if(brand !== undefined){
            setpro.brand = brand;
        }
        if(supplier !== undefined){
            setpro.supplier = supplier;
        }
        if(mcycle !== undefined){
            setpro.mcycle = mcycle;
        }
        if(ucycle !== undefined){
            setpro.ucycle = ucycle;
        }
        if(wlife !== undefined){
            setpro.wlife = wlife;
        }
        if(purDate !== undefined){
            setpro.purDate = purDate;
        }
        if(pdDate !== undefined){
            setpro.pdDate = pdDate;
        }
        if(stDate !== undefined){
            setpro.stDate = stDate;
        }
        if(region !== undefined){
            setpro.region = region;
        }
        if(option !== undefined){
            setpro.option = option;
        }

        _model.update({_id: aNO}, {$set: setpro}, callback)
    };

    _model.operate_asset = function (aNO, state, time, callback) {
        _model.update({_id: aNO}, {$set: {state: state, modifyTime: time}}, callback);
    };

    _model.asset_unstorage = function (aNO, state, region, time, callback) {
        _model.update({_id: aNO}, {$set: {state: state, region: region, stDate: time, modifyTime: time}}, callback);
    };

    _model.asset_use = function (aNO, state, date, time, callback) {
        _model.update({_id: aNO}, {$set: {state: state, pdDate: date, modifyTime: time}}, callback);
    };

    _model.asset_unuse = function (aNO, state, date, time, callback) {
        _model.update({_id: aNO}, {$set: {state: state, stDate: date, modifyTime: time}}, callback);
    };


    _model.clear_invalid_data = function (state, time, callback) {
        _model.remove({_state: state, modifyTime: {$lt: time}}, callback);
    };

    _model.update_asset_state = function (aNO, state, callback) {
        _model.update({_id: aNO}, {$set: {_state: state, modifyTime: new Date()}}, callback);
    };

    _model.asset_maintain = function (aNO, time, callback) {
        _model.update({_id: aNO}, {$set: {lmDate: time}}, callback);
    };

    _model.find_assets = function (param, fields, callback) {
        return _model.find(param, fields, callback);
    };

    return _model;
};