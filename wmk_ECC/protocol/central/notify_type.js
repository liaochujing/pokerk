/**
 * Created by wangxh on 2017/10/13.
 */

'use strict';

var notify_type = {
    alarm_manual_end: 0x0000F001,//告警手动结束
    alarm_generated: 0x0000F002,//告警产生
    alarm_ended: 0x0000F003,//告警结束
    alarm_hangup: 0x0000F005,//告警挂起
    alarm_confirmed: 0x0000F006,//告警确认
    alarm_force_end: 0x0000F007,//告警强制结束
    alarm_convergenced: 0x0000F008,//告警收敛变更
    alarm_unhangup: 0x0000F009,//告警解挂
    alarm_star_changed: 0x0000F00A,//关注告警变更

    order_generated: 0x0000F011,//告警工单产生
    alarm_upload: 0x0000F020,//告警上传(实时)
    his_alarm_upload: 0x0000F021,//告警上传(历史)

    name_object_created: 0x0000AF01,//对象新增
    name_object_removed: 0x0000AF02,//对象删除
    name_object_modified: 0x0000AF03,//对象修改
    name_object_add_relation: 0x0000AF04,//添加对象关系
    name_object_del_relation: 0x0000AF05,//删除对象关系
    device_point_modified: 0x0000AF06,//设备点配置变更

    operator_object_created: 0x0000BF01,//人员相关对象新增
    operator_object_removed: 0x0000BF02,//人员相关对象删除
    operator_object_modified: 0x0000BF03,//人员相关对象修改

    collect_object_created: 0x0000CF01,//采集对象新增
    collect_object_removed: 0x0000CF02,//采集对象删除
    collect_object_modified: 0x0000CF03,//采集对象修改
    collect_device_point_changed: 0x0000CF04,//采集设备点变更

    asset_created: 0x0000DF01,//资产新增
    asset_removed: 0x0000DF02,//资产删除
    asset_modified: 0x0000DF03,//资产修改

    role_created: 0x0000EF01,//角色添加
    role_modified: 0x0000EF02,//角色修改
    role_deleted: 0x0000EF03,//角色删除

    //管理
    restart: 0x0000FF01,//重启
    alarm_type_changed: 0x0000FF02,//告警条件变更
    alarm_type_deleted: 0x0000FF03,//告警条件删除
    device_type_changed: 0x0000FF04,//设备类型变更
    device_type_deleted: 0x0000FF05,//设备类型删除
    collect_device_type_changed: 0x0000FF06,//采集设备类型变更
    collect_device_type_deleted: 0x0000FF07,//采集设备类型删除

    sync_data: 0x0000FFFF,//同步数据
};

module.exports = notify_type;