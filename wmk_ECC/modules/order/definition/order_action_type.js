/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var odr_act_type = {
    send: 0,//发起
    receive: 1,//接收
    rollback: 2,//回退
    handle: 3,//处理完成(提交下一步)
    finish: 4,//完成
    handover: 5,//交接
    
    add_order: 10,//创建工单
    modify_order: 11,//修改工单
    delete_order: 12,//删除工单

    alarm_order_rule: 20,//告警工单派单规则配置
    alarm_order_config: 21,//告警工单通知规则配置
    alarm_timeout_rule: 22,//告警工单超时规则配置
    maintain_order_config: 23,//维护工单配置
    maintain_template: 24,//维护工单模板配置
    drill_order_config: 25,//演练工单配置
    inspection_order_rule: 26,//巡检工单派单规则设置
    inspection_notify_rule: 27,//巡检工单通知规则设置
    inspection_template: 28,//巡检工单模板配置

    set_inspection_content: 29,//巡检内容编辑
    del_inspection_content: 30,//巡检内容删除
};

module.exports = odr_act_type;