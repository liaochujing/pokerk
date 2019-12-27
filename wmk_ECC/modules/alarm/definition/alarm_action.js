/**
 * Created by wangxh on 2017/12/27.
 */

'use strict';

module.exports = {
    alarm_gen: 1,//确认告警
    confirm_alarm: 2,//确认告警
    hangup_alarm: 3,//挂起告警
    unhangup_alarm: 4,//解挂告警
    force_end_alarm: 5,//强制结束告警
    alarm_end: 6,//告警结束
    manual_alarm_end: 7,//手动告警结束

    alarm_type_changed: 10,//修改告警条件
    alarm_type_deleted: 11,//删除告警条件

    hangup_point: 12,//挂起告警点
    shield_point: 13,//屏蔽告警点

    alarm_convergence: 14,//告警收敛配置
    shield_device: 15,//屏蔽设备

    alarm_notify_config: 20,//告警通知配置
    schedule_notify_config: 21,//定时通知配置
    alarm_aom_config: 22,//声光告警配置

};