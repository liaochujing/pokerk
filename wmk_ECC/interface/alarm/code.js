/**
 * Created by wangxh on 2017/7/26.
 */

'use strict';

var alm_code = { //微模块命令结果码
    unknown: -1,//未知

    ok: 0,//成功

    not_login: 1,
    password_error: 2,
    param_error: 3,
    not_found: 4,
    invalid_request: 5,
    has_no_privilege: 6,
    user_expired: 7,

    other: 10,

    getText: function (code) {
        switch(code){
            case this.unknown:
                return '未知错误';
            case this.ok:
                return '成功';
            case this.not_login:
                return '未登录';
            case this.password_error:
                return '密码错误';
            case this.param_error:
                return '参数错误';
            case this.not_found:
                return '未找到';
            case this.invalid_request:
                return '无效的请求';
            case this.has_no_privilege:
                return '没有权限';
            case this.user_expired:
                return '账号已过期';
            case this.other:
                return '其他错误';
            default:
                return '未知错误';
        }
    }
};

module.exports = alm_code;