/**
 * Created by wangxh on 2017/11/23.
 */

'use strict';

module.exports = {

    point_collected: 0x0000F001, //设备点(上传)
    state_collected: 0x0000F002, //设备状态(上传)

    alarm_point_on: 0x0002F001,//告警产生(通知)
    alarm_point_off: 0x0002F002,//告警结束(通知)
    device_state_changed: 0x0002F003,//设备状态改变(通知)
    third_party_event: 0x0002F004,//第三方事件上传
    third_party_event_operation: 0x0002F005,//第三方事件操作上传

};