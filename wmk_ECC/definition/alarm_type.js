/**
 * Created by wangxh on 2017/10/11.
 */

'use strict';

var alm_type = {

    none: 0,
    strong: 1,//强电
    HVAC: 2,//暖通
    weak: 3,//弱电
    fault: 4,//故障

    getText: function (level){
        switch(level){
            case this.none:
                return '无';
            case this.strong:
                return '供配电';
            case this.HVAC:
                return '暖通';
            case this.weak:
                return '给排水';
            case this.fault:
                return '空调';
            default:
                return '未知';
        }
    }
};

module.exports = alm_type;