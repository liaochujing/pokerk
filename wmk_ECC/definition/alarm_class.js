/**
 * Created by wangxh on 2017/10/11.
 */

'use strict';

var alm_type = {
    alarm: 0,               // 告警

    server: 1,              //服务器告警

    //第三方告警事件
    third_party_event: 10,
    ba_event: 11,           //BA事件
    fan_event: 12,           //风机联动事件
    last_third_party_event: 20,

};

module.exports = alm_type;