/**
 * Created by wangxh on 2017/10/23.
 */

'use strict';

var ah = require('../../util/array_helper');
// var uiclassID = require('../../definition/uiClassID');

var cmd = require('./cmd');
var code = require('./code');

var DataMessage = require('../definition/data_message');
var serverManager = require('./server_manager');

function get_point_value_list(identitys, callback, interval) {
    if(identitys.length <= 0){
        callback();
        return;
    }

    var list = [];
    var _dics = {};
    for(var i=0;i<identitys.length;i++){
        var identity = identitys[i];
        var serverNO = identity.serverNO || defaultServerNO;

        if(!_dics[serverNO]){
            var _item = {
                serverNO: serverNO,
                items: {}
            };
            list.push(_item);
            _dics[serverNO] = _item;
        }

        if(_dics[serverNO].items[identity.id]){
            _dics[serverNO].items[identity.id].push(identity.pointIndex);
        }else{
            _dics[serverNO].items[identity.id] = [identity.pointIndex];
        }
    }

    if(list.length == 1){
        var item = list[0];
        get_point_value(item.serverNO, item.items, function (err, data) {
            if(err) return callback(err);

            var response = {};
            response[item.serverNO] = data;

            callback(null, response);
        }, interval);
    }else{
        var response = {};
        ah.each_series(list, function (item, cbItem) {
            get_point_value(item.serverNO, item.items, function (err, data) {
                if(err) return cbItem(err);
                response[item.serverNO] = data;

                cbItem();
            }, interval);
        }, function (err) {
            callback(null, response)
        })
    }
}

function get_point_value_dic(identitys, callback, interval) {
    if(identitys.length <= 0){
        callback();
        return;
    }

    var list = [];
    var _dics = {};
    for(var i=0;i<identitys.length;i++){
        var identity = identitys[i];
        var serverNO = identity.serverNO;

        if(!_dics[serverNO]){
            var _item = {
                serverNO: serverNO,
                items: {}
            };
            list.push(_item);
            _dics[serverNO] = _item;
        }

        if(_dics[serverNO].items[identity.id]){
            _dics[serverNO].items[identity.id] = _dics[serverNO].items[identity.id].concat(identity.ids);
        }else{
            _dics[serverNO].items[identity.id] = identity.ids;
        }
    }

    if(list.length == 1){
        var item = list[0];
        get_point_value(item.serverNO, item.items, function (err, data) {
            if(err) return callback(err);

            var response = {};
            response[item.serverNO] = data;

            callback(null, response);
        }, interval);
    }else{
        var response = {};
        ah.each_series(list, function (item, cbItem) {
            get_point_value(item.serverNO, item.items, function (err, data) {
                if(err) return cbItem(err);
                response[item.serverNO] = data;

                cbItem();
            }, interval);
        }, function (err) {
            callback(null, response)
        })
    }
}

function get_device_point_value(identity, callback) {
    if(!identity){
        callback();
        return;
    }

    var msg = new DataMessage(cmd.cen_0x00010001, {identity: identity});
    serverManager.send(msg, function (err, data) {
        if(err){
            callback(err);
            return;
        }
        callback(null, data);
    })
}

function get_point_value(serverNO, identitys, callback, interval) {
    if(!identitys){
        callback();
        return;
    }

    //检查去除重复
    for(var i in identitys){
        var _list = identitys[i];
        var _dic = {};

        var resList = [];
        if(_list && _list.length > 0){
            for(var j=0;j<_list.length;j++){
                var pointIndex = _list[j];
                if(!_dic[pointIndex]){
                    _dic[pointIndex] = 1;
                    resList.push(pointIndex);
                }
            }
        }
        identitys[i] = resList;
    }

    var msg = new DataMessage(cmd.cen_0x00010002, {serverNO: serverNO, devices: identitys, interval: interval});
    serverManager.send(msg, function (err, data) {
        if(err && err.status == code.connection_error) {//连接错误重试一次
            setTimeout(function () {//重试一次
                serverManager.send(msg, function (err, data) {
                    if(err) {
                        callback(err);
                        return;
                    }
                    callback(null, data);
                });
            }, 300);
        }else{
            callback(err, data);
        }
    });
}

module.exports.get_device_point_value = get_device_point_value;
module.exports.get_point_value_list = get_point_value_list;
module.exports.get_point_value_dic = get_point_value_dic;
module.exports.get_point_value = get_point_value;