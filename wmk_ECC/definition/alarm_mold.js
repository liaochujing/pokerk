/**
 * Created by wangxh on 2017/10/11.
 */

'use strict';

var alm_mold = {
    other: 0,
    fault: 1,

    getText: function (level){
        switch(level){
            case this.fault:
                return '离线通知';
            case this.other:
                return '异常通知';
            default:
                return '异常通知';
        }
    }
};

module.exports = alm_mold;