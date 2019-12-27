'use strict';

var FFI = require('ffi');
var ref = require('ref');


var libMaxSnmp = FFI.Library('libmax_snmp', {
    'init_max_snmp': [
        'void', []
    ],
    'run_max_snmp': [
        'void', []
    ],
    'register_scalar_oid': [
        'int32', ['string', 'pointer']
    ],
    'malloc_buffer': [
        'pointer', ['int32']
    ],
    'notify_get_value_finish': [
        'void', ['string', 'int32', 'pointer', 'int32']
    ],
    'notify_get_int_value_finish': [
        'void', ['string', 'int32']
    ],
    'notify_get_string_value_finish': [
        'void', ['string', 'string']
    ],
    'notify_get_value_failed': [
        'void', ['string', 'int32']
    ],
    'set_wait_value_timeout': [
        'void', ['int32']
    ],
    'register_table_oid': [
        'int32', ['string', 'int32', 'int32', 'pointer']
    ],
    'add_table_index': [
        'void', ['string', 'int32']
    ],
    'set_table_row_count': [
        'void', ['string', 'int32']
    ]
});

var max_snmp = module.exports;
max_snmp.init_max_snmp = libMaxSnmp.init_max_snmp;
max_snmp.run_max_snmp = libMaxSnmp.run_max_snmp;
max_snmp.register_scalar_oid = libMaxSnmp.register_scalar_oid;
max_snmp.malloc_buffer = libMaxSnmp.malloc_buffer;
max_snmp.notify_get_value_finish = libMaxSnmp.notify_get_value_finish;
max_snmp.notify_get_int_value_finish = libMaxSnmp.notify_get_int_value_finish;
max_snmp.notify_get_string_value_finish = libMaxSnmp.notify_get_string_value_finish;
max_snmp.notify_get_value_failed = libMaxSnmp.notify_get_value_failed;
max_snmp.set_wait_value_timeout = libMaxSnmp.set_wait_value_timeout;
max_snmp.register_table_oid = libMaxSnmp.register_table_oid;
max_snmp.add_table_index = libMaxSnmp.add_table_index;
max_snmp.set_table_row_count = libMaxSnmp.set_table_row_count;