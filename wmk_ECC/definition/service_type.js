/**
 * Created by wangxh on 2017/9/27.
 */

'use strict';

var service_type = {
    none: 0x0, //
    user: 0x1,//user
    manager: 0x2,//管理（配置）服务
    central: 0x4,//业务中心服务
    intersvr:0x8,//对接服务
    data: 0x10,//数据中控
    collect: 0x20,//采集服务
    alarm: 0x40,//告警服务
    capacity: 0x80,//容量管理服务
    energy: 0x100,//能耗管理服务
    asset: 0x200,//资产
    order: 0x400,//工单
    config: 0x800,//配置

    ecc     : 0x10000,//ECC端
    client  : 0x100000,//客户端
    sync    : 0x200000,//A9配置同步

    getText: function (type) {
        switch(type){
            case this.none:
                return 'none';
            case this.manager:
                return 'manager';
            case this.collect:
                return 'collect';
            case this.alarm:
                return 'alarm';
            case this.intersvr:
                return 'intersvr';
            case this.user:
                return 'user';
            case this.data:
                return 'data';
            case this.central:
                return 'central';
            case this.capacity:
                return 'capacity';
            case this.energy:
                return 'energy';
            case this.asset:
                return 'asset';
            case this.order:
                return 'order';
            case this.config:
                return 'config';
            case this.ecc:
                return 'ecc';
            case this.client:
                return 'client';
            case this.sync:
                return 'sync';
            default:
                return 'unknown';
        }
    }
};

module.exports = service_type;