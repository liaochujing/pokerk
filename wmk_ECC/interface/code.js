/**
 * Created by wangxh on 2017/12/30.
 */

'use strict';

var code = { //微模块命令结果码
    unknown: -1,//未知

    ok: 0,//成功

    not_login: 1,
    password_error: 2,
    param_error: 3,
    not_found: 4,
    invalid_request: 5,
    has_no_privilege: 6,
    user_expired: 7,

    other: 10
};

module.exports = code;