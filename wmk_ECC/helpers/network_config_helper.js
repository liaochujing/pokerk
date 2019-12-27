/**
 * Created by wangxh on 2017/5/2.
 */

'use strict';

var util = require('util');
var api =  require('../export/lib_net_config');

function set_config(config, callback) {
    var data = {
        device_name: config.device_name,
        dns1: config.dns1,
        dns2: config.dns2,
        card_info: []
    };

    for(var i in config.card_info){
        var item = config.card_info[i];
        data.card_info.push({
            mac: item.mac,
            card_name: item.card_name,
            ip_way: item.ip_way,
            address: item.address,
            netmask: item.netmask,
            gateway: item.gateway
        })
    }

    var ret = api.set_config_json(JSON.stringify(data));
    if(ret != 0){
        callback(new Error('set net config failed, ret: ' + ret));
    }else{
        callback();
    }
}

function get_config(callback) {
    var json = api.get_config_json();
    if(json){
        var config = JSON.parse(json);
        var data = {
            device_name: config.device_name,
            dns1: config.dns1,
            dns2: config.dns2,
            card_info: []
        };

        for(var i in config.card_info){
            var item = config.card_info[i];
            data.card_info.push({
                mac: item.mac,
                card_name: item.card_name,
                ip_way: item.ip_way,
                address: item.address,
                netmask: item.netmask,
                gateway: item.gateway
            })
        }

        callback(null, data);
    }else{
        callback();
    }
}

module.exports.set_config = set_config;
module.exports.get_config = get_config;