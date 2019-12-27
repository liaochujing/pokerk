/**
 * Created by wangxh on 2017/9/27.
 */

'use strict';

module.exports = {
    lt: 0,  //小于
    lte: 1, //小于等于
    eq: 2,   //等于
    gte: 3, //大于等于
    gt: 4,  //大于
    ne: 5,   //不等于

    getText: function (values){
        switch(values){
            case this.lt:
                return '小于';
            case this.lte:
                return '小于等于';
            case this.eq:
                return '等于';
            case this.gte:
                return '大于等于';
            case this.gt:
                return '大于';
            case this.ne:
                return '不等于';
        }
        return values;
    },

    //获取相反值
    getContrary: function (values){
        switch(values){
            case this.lt:
                return this.gte;
            case this.lte:
                return this.gt;
            case this.eq:
                return this.ne;
            case this.gte:
                return this.lt;
            case this.gt:
                return this.lte;
            case this.ne:
                return this.eq;
        }
        return values;
    }
};