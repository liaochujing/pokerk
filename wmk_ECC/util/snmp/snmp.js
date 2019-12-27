/**
 * Created by wangxh on 2017/6/17.
 */

'use strict';

var FFI = require('ffi');
var lib = require('../../export/lib_snmp');
var logger = require('../log_manager').logger;

var DataType = require('./snmp_data_type');
var Errors = require('./snmp_errors');

var _callbacks = [];

function combine(root, entry) {
    return root + '.' + entry;
}

function gen_scalar_callback(func) {
    return FFI.Callback('int32', ['string'], func);
}

function gen_table_callback(func) {
    return FFI.Callback('int32', ['string', 'int32', 'int32'], func);
}

function register_scalar_oid(oid, func, wrap) {
    if(!wrap){
        func = gen_scalar_callback(func);
    }
    _callbacks.push(func);

    lib.register_scalar_oid(oid, func)
}

function register_table_oid(oid, min, max, func, wrap) {
    if(!wrap){
        func = gen_table_callback(func);
    }
    _callbacks.push(func);

    lib.register_table_oid(oid, min, max, func)
}

function resp_ok(oid, type, value) {
    switch(type){
        case DataType.integer:
            lib.notify_get_int_value_finish(oid, value);
            break;
        case DataType.string:
            lib.notify_get_string_value_finish(oid, value);
            break;
        default:
            logger.error('resp oid: %s, code: %d', oid, Errors.badValue);
            lib.notify_get_value_failed(oid, Errors.badValue);
            break;
    }
}

function resp_err(oid, code) {
    logger.error('resp oid: %s, code: %d', oid, code);
    lib.notify_get_value_failed(oid, code);
}

module.exports.combine = combine;

module.exports.gen_scalar_callback = gen_scalar_callback;
module.exports.gen_table_callback = gen_table_callback;

module.exports.register_scalar_oid = register_scalar_oid;
module.exports.register_table_oid = register_table_oid;

module.exports.resp_ok = resp_ok;
module.exports.resp_err = resp_err;