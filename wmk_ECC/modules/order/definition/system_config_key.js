/**
 * Created by wangxh on 2017/11/9.
 */

'use strict';

var keys = {
    alarm: 'alarm',//告警工单通知规则
    maintain: 'maintain',//维护工单通知规则
    drill: 'drill',//演练工单通知规则
    inspection: 'inspection',//巡检工单通知规则

    alarm_order_rule: 'alarm_order_gen',//告警派单规则
    inspection_order_rule: 'inspection_order_gen',//巡检工单派单规则

    alarm_timeout_rule: 'alarm_notify',//告警超时通知规则
    maintain_template: 'maintain_template',//维护工单模板
    inspection_template: 'inspection_template',//巡检工单模板
};

module.exports = keys;