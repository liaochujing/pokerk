/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var mongoose = require('mongoose');

var CustomerSchema = new mongoose.Schema({
    _id: Number,
    id: Number,
    name: String,//简称
    fullName: String,//全名
    contacts: String,//联系人
    tel: String,//联系方式
    fax: String,//传真
    postalCode: String,//邮编
    location: String,//地址
    website: String,//网站
    state: Number,//1：正常，2：作废
    desc: String,//备注
    createTime: Date,//创建时间
    modifyTime: Date//修改时间
},{collection: "customer", versionKey: false});

module.exports = function (conn) {
    var _model = conn.model("customer", CustomerSchema);

    _model.insert_customer = function (id, name, fullName, contacts, tel, fax, postalCode, location, website, state, desc, createTime, modifyTime, callback) {
        _model.collection.insertOne({
            _id: id,
            id: id,
            name: name,
            fullName: fullName,
            contacts: contacts,
            tel: tel,
            fax: fax,
            postalCode: postalCode,
            location: location,
            website: website,
            state: state,
            desc: desc,
            modifyTime: modifyTime,
            createTime: createTime
        }, callback)
    };

    _model.update_customer = function (id, name, fullName, contacts, tel, fax, postalCode, location, website, state, desc, modifyTime, callback) {
        _model.update({_id: id}, {$set: {
            name: name,
            fullName: fullName,
            contacts: contacts,
            tel: tel,
            fax: fax,
            postalCode: postalCode,
            location: location,
            website: website,
            state: state,
            desc: desc,
            modifyTime: modifyTime
        }}, callback)
    };

    _model.delete_customer = function (id, callback) {
        _model.remove({_id: id}, callback);
    };

    _model.find_customer = function (param, fields, callback) {
        return _model.find(param, fields, callback);
    };

    return _model;
};