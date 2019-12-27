/**
 * Created by wangxh on 2016/12/8.
 */

'use strict';

var FFI = require('ffi');
var ref = require('ref');
var logger = require('../log_manager').logger;
var libSnmpClient = require('../../export/lib_snmp_client');

function init(done) {
    libSnmpClient.init_snmp_client();
    done();
}

var _callbacks = {};
var on_message = function (oid, ret_buffer, ret_buffer_size) {
    var func;
    if(_callbacks[oid] && _callbacks[oid].length > 0){
        func = _callbacks[oid].shift();
        if(_callbacks[oid].length <= 0){
            delete _callbacks[oid];
        }
    }

    if (ret_buffer_size == 0) {
        return;
    }

    process.nextTick(function () {
        var ret_buf = ref._reinterpret(ret_buffer, ret_buffer_size);

        var index = 0;

        var status = ret_buf.readInt32LE(index);
        index += 4;
        var errstat = ret_buf.readInt32LE(index);
        index += 4;
        var type = ret_buf.readInt32LE(index);
        index += 4;
        var value_length = ret_buf.readInt32LE(index);
        index += 4;
        var value_buf;
        if (value_length > 0) {
            value_buf = ret_buf.slice(index, index + value_length);
            index += value_length;
        }

        var code = errstat;
        var value;
        if (errstat == 0) {
            if(status == libSnmpClient.STAT_SUCCESS && value_buf){
                if (value_length > 0) {
                    switch(type){
                        case 2:
                            value = value_buf.readInt32LE();
                            break;
                        case 4:
                            value = value_buf.toString('ascii');
                            break;
                        case 0x40 | 0x01:
                            value = value_buf.readUInt32LE();

                            // var offset = 0;
                            //
                            // var _tag = value_buf.readUInt8();
                            // offset += 1;
                            // var lenlen = value_buf.length - offset;
                            // var len = value_buf.length;
                            // value_buf.readUInt8(offset);	/* Consume length byte */
                            // offset += 1;
                            //
                            // var x;
                            // if (len === 5) {
                            //     x = value_buf.readUInt8(offset);
                            //     offset += 1;
                            //     if (x === 0)
                            //         --len;
                            // }
                            // if (lenlen > 1 || len > 4){
                            //     console.log(lenlen, len, value_buf);
                            //     throw new RangeError('integer is too long');
                            // }
                            //
                            // x = 0;
                            // for (; len > 0; len--) {
                            //     x <<= 8;
                            //     x |= value_buf.readUInt8(offset);
                            //     offset += 1;
                            // }
                            // value = x >>> 0;
                            break;
                        default:
                            value = value_buf;
                            break;
                    }
                } else {
                    code = type;
                }
            }else{
                code = 5;
            }
        }
        libSnmpClient.release_ret_info(ret_buffer);

        if(code != 0){
            logger.error({msg: 'snmp get failed', oid: oid, code: code, data: value_buf})
        }

        if(func){
            func(code, {type: type, data: value});
        }else{
            logger.info({msg: 'snmp handle msg failed: callback not found', oid: oid, code: code, data: value_buf});
        }
    })
};
var on_message_callback = FFI.Callback('void', ['string', 'pointer', 'int32'], on_message);

function snmpGet(ip, community, version, oid, callback) {
    if(_callbacks[oid]){
        _callbacks[oid].push(callback);
    }else{
        _callbacks[oid] = [callback];
    }

    //logger.error('=> req oid: ', oid);
    libSnmpClient.snmp_get(ip, ip, community, version, oid, 3000, 0, on_message_callback);
}

module.exports.init = init;
module.exports.snmpGet = snmpGet;