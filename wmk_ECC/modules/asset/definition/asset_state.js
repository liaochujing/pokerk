/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var asset_state = {
    storage: 1,//在库
    unused: 2,//未使用
    used: 3,//已使用
    maintain:4,//维护中
    scrap: 5,//报废
};

module.exports = asset_state;