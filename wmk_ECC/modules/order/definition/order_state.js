/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var order_state = {
    draft: 0,//草稿
    unreceived: 1,//未接收
    processing: 2,//处理中
    finished: 3,//办结
};

module.exports = order_state;