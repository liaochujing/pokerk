/**
 * Created by wangxh on 2017/7/26.
 */

'use strict';

var ast_code = { //微模块命令结果码
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

    asset_no_dup: 3601,
    pos_dup: 3602,
    asset_not_in_storage: 3603,
    asset_not_on_storage: 3604,
    specification_not_set: 3605,

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
            case this.asset_no_dup:
                return '资产编号重复';
            case this.pos_dup:
                return 'U位冲突';
            case this.asset_not_in_storage:
                return '资产非在库状态';
            case this.asset_not_on_storage:
                return '资产非上架状态';
            case this.specification_not_set:
                return '未设置规格，无法上架';
            default:
                return '未知错误';
        }
    }
};

module.exports = ast_code;