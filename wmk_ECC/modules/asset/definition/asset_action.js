/**
 * Created by wangxh on 2017/11/12.
 */

'use strict';

var asset_action = {
    storage: 1, //入库
    unstorage: 2, //出库
    use: 3,//启用
    unuse: 4,//停用
    maintain:5,//维护
    maintained:6,//修复
    scrap: 7,//报废
    unscrap: 8,//撤销报废
    part_unstorage: 9, //配件出库
};

module.exports = asset_action;