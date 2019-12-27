'use strict';

var FFI = require('ffi');
var ref = require('ref');
var Struct = require('ref-struct');

var RetInfo = Struct({
    status: 'int32',		//STAT_SUCCESS or STAT_TIMEOUT or STAT_ERROR
    errstat : 'int32',	//错误码。status为STAT_SUCCESS时有效
    type : 'int32', 		//值类型
    value_length : 'int32',
    value : 'pointer'
});

var RetInfoPtr = ref.refType(RetInfo);

var libMaxSnmpClient = FFI.Library('libmax_snmp_client', {
    'init_snmp_client': [
        'void', []
    ],
    'cleanup_snmp_client': [
        'void', []
    ],
    'release_ret_info': [
        'void', ['pointer']
    ],
    'snmp_get': [
        'int32', ['string', 'string', 'string', 'int32', 'string', 'int32', 'int32', 'pointer']
    ]
});

var max_snmp_client = module.exports;
max_snmp_client.init_snmp_client = libMaxSnmpClient.init_snmp_client;
max_snmp_client.cleanup_snmp_client = libMaxSnmpClient.cleanup_snmp_client;
max_snmp_client.release_ret_info = libMaxSnmpClient.release_ret_info;
max_snmp_client.snmp_get = libMaxSnmpClient.snmp_get;

max_snmp_client.RetInfo = libMaxSnmpClient.RetInfo;
max_snmp_client.RetInfoPtr = libMaxSnmpClient.RetInfoPtr;

max_snmp_client.STAT_SUCCESS = 0;
max_snmp_client.STAT_ERROR = 1;
max_snmp_client.STAT_TIMEOUT = 2;
