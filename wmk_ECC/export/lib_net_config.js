/**
 * Created by wangxh on 2017/7/20.
 */

'use strict';

var FFI = require('ffi');

//返回值：0为成功
var lib_api = FFI.Library('xx', {
    'set_device_net_params': [
        'int32',
        ['string']
    ],
    'get_device_net_params': [
        'string',
        []
    ]
});

var api = module.exports;

api.set_config_json = lib_api.set_device_net_params;
api.get_config_json = lib_api.get_device_net_params;