/**
 * Created by wangxh on 2017/7/26.
 */

'use strict';

var failed_prefix = 0x00000000; //微模块失败结果码前缀

var result_code = { //微模块命令结果码
    //成功段
    ok: 0,          // 成功

    //失败段
    unknown: failed_prefix | 0xFF00,         // 未知错误
    not_support: 1,           // 不支持的命令
    param_error: 2,           // 参数错误
    connection_error: 3,         // connection错误
    not_found: 4,
    other_error: 5,
    invalid_request: 6,

    getText: function (code) {
        switch(code){
            case this.ok:
                return '成功';
            case this.unknown:
                return '未知错误';
            case this.not_support:
                return '命令不支持';
            case this.param_error:
                return '参数错误';
            case this.connection_error:
                return '连接错误';
            case this.not_found:
                return '未找到';
            case this.other_error:
                return '其他错误';
            case this.invalid_request:
                return '无效的请求';
            default:
                return '其他错误'
        }
    }
};

module.exports = result_code;