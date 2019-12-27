/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var util = require('util');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var OrderState = require('./../definition/order_state');
var uiclassID = require('../../../definition/uiClassID');
var cfgKey = require('./../definition/system_config_key');
var NotifyTag = require('./../definition/notify_tag');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var dbOrder = db.order;
var cfg = db.ramdb.cfg;

var operatorHelper = require('./operator_helper');

var msgHelper = require('../../../helpers/message_helper');
var NotifyMode = require('../../../definition/notice_type');

function check_notify() {
    var now = Date.now();

    var rdbOrder = ramdb.order;
    var orderList = rdbOrder.get_all_order();
    for(var k=0;k<orderList.length;k++){
        var order = orderList[k];
        if(order.state == OrderState.unreceived || order.state == OrderState.processing) {
            check_notify_immediately(order, now);
        }
    }
}

function check_notify_immediately(order, now) {
    switch(order.classID){
        case uiclassID.alarmOrder:
            var group = order.group;

            var orderConfig = cfg.get_system_config(cfgKey.alarm);
            if(orderConfig && order.step == 1){
                switch(order.state){
                    case OrderState.unreceived:
                        if(orderConfig.receiveTimeout > 0 && (now - order.sendTime.getTime()) > orderConfig.receiveTimeout * 60 * 1000 && !order.notifyInfo[NotifyTag.receive]){
                            var user = order.recipient;
                            if(user == undefined){
                                user = operatorHelper.get_on_duty(order.group);
                            }

                            notify_immediately(order, user, NotifyTag.receive, orderConfig.option, '接收超时');
                        }
                        break;
                    case OrderState.processing:
                        if(orderConfig.handleTimeout > 0 && (now - order.receiveTime.getTime()) > orderConfig.handleTimeout * 60 * 1000){
                            notify_immediately(order, operatorHelper.get_user_leader(group, order.recipient), NotifyTag.handle, orderConfig.option, '处理超时');
                        }
                        break;
                    default:
                        break;
                }
            }

            if(orderConfig && !order.restData.endTime){
                //TODO: 发送通知前判断告警状态(防止通知丢失).
                var alarmConfig = undefined;
                var _alarmClassID = order.restData.alarm.classID;
                var alarmConfigList = cfg.get_system_config(cfgKey.alarm_timeout_rule);
                if(alarmConfigList){
                    for(var i=0;i<alarmConfigList.length;i++){
                        var item = alarmConfigList[i];

                        if(item.alarmClassID.indexOf(_alarmClassID) >= 0){
                            alarmConfig = item;
                            break;
                        }
                    }
                }
                if(alarmConfig){
                    var timeout = (now - order.restData.startTime.getTime()) / 60 / 1000;
                    if(alarmConfig.inspectorTimeout > 0 && timeout > alarmConfig.inspectorTimeout){
                        notify_immediately(order, operatorHelper.get_group_inspector(group), NotifyTag.inspector, orderConfig.option, '告警超时未结束');
                    }else if(alarmConfig.directorTimeout > 0 && timeout > alarmConfig.directorTimeout){
                        notify_immediately(order, operatorHelper.get_group_director(group), NotifyTag.director, orderConfig.option, '告警超时未结束');
                    }else if(alarmConfig.leaderTimeout > 0 && timeout > alarmConfig.leaderTimeout){
                        notify_immediately(order, operatorHelper.get_group_leader(group), NotifyTag.leader, orderConfig.option, '告警超时未结束');
                    }
                }
            }
            break;
        case uiclassID.assetOrder:
            var orderConfig = cfg.get_system_config(cfgKey.maintain);
            if(orderConfig && order.state == OrderState.unreceived){
                if(orderConfig.receiveTimeout > 0 && (now - order.sendTime.getTime()) > orderConfig.receiveTimeout * 60 * 1000){
                    notify_immediately(order, order.recipient, NotifyTag.receive, orderConfig.option, '超时未接收');
                }
            }

            if(orderConfig && (now - order.restData.planTime.getTime()) > orderConfig.aheadPlanDay * 24 * 60 * 60 * 1000){
                notify_immediately(order, order.recipient, NotifyTag.plan, orderConfig.option, '计划维护');
            }
            break;
        case uiclassID.drillOrder:
            var orderConfig = cfg.get_system_config(cfgKey.drill);
            if(orderConfig && order.state == OrderState.unreceived){
                if(orderConfig.receiveTimeout > 0 && (now - order.sendTime.getTime()) > orderConfig.receiveTimeout * 60 * 1000){
                    notify_immediately(order, order.recipient, NotifyTag.receive, orderConfig.option, '超时未接收');
                }
            }
            break;
        case uiclassID.inspectionOrder:
            if(order.step == 2 && order.state == OrderState.unreceived){
                var orderConfig = cfg.get_system_config(cfgKey.inspection);
                if(orderConfig){
                    if(orderConfig.receiveTimeout > 0 && (now - order.sendTime.getTime()) > orderConfig.receiveTimeout * 60 * 1000){
                        notify_immediately(order, order.recipient, NotifyTag.receive, orderConfig.option, '超时未接收');
                    }
                }
            }
            break;
    }
}

function notify_immediately(order, user, tag, option, reason) {
    if(!order.notifyInfo[tag]){
        var data = {user: user, time: new Date()};
        order.notifyInfo[tag] = data;

        //TODO: format order msg.
        var msg = util.format('编号:%s  \r\n名称:%s  \r\n时间:%s', order.id, order.fullName, order.sendTime.format_datetime());
        if(reason){
            msg += ('  \r\n原因:' + reason);
        }

        if(user != undefined){
            if(user instanceof Array){
                ah.each_series(user, function (item, cbItem) {
                    _send_notify(item, msg, option);
                    process.nextTick(function () {
                        cbItem();
                    })
                }, function () {
                    
                })
            }else{
                _send_notify(user, msg, option);
            }
        }

        dbOrder.update_notify_tag(order.serverNO, order.classID, order.id, tag, data, function (err) {
            if(err) logger.error({msg: 'update order tag failed', err: err});
        })
    }
}

function notify_receive(order, reqson) {
    var mode = undefined;

    var orderConfig = cfg.get_system_config(cfgKey.alarm);
    if(orderConfig && orderConfig.mode){
        mode = orderConfig.mode;
    }
    if(!mode){
        mode = [NotifyMode.dingding];
    }

    //TODO: format order msg.
    var msg = util.format('>编号:%s  \r\n>名称:%s  \r\n>时间:%s', order.id, order.fullName, order.sendTime.format_datetime());
    msg += ('  \r\n>原因:' + reqson);

    if(order.recipient != undefined){
        _send_notify(order.recipient, msg, {mode: mode, retry: 1, retryInterval: 0});
    }
}

function _send_notify(user, msg, option) {
    if(!option){
        return;
    }
    
    var modeList = option.mode;
    if(user != undefined && modeList && modeList.length > 0){
        var operator = ramdb.oo.get_operator_by_id(user);
        if(operator){
            var contact = operator.contact;
            ah.each_series(modeList, function (mode, cbItem) {
                var recipient = '';
                switch(mode){
                    case NotifyMode.dingding:
                        recipient = contact.dd;
                        break;
                    case NotifyMode.email:
                        recipient = contact.email;
                        break;
                    case NotifyMode.message:
                        recipient = contact.tel;
                        break;
                }
                if(recipient){
                    var opt = {times: option.retry, interval: option.retryInterval};
                    if(!option.retry){
                        opt.times = 1;//默认发送一次
                    }
                    ah.retry(opt, function (cb) {
                        msgHelper.send_message(mode, recipient, '工单提醒', msg, function (err) {
                            if(err){
                                logger.error({msg: 'send message failed', err: err, mode: mode});
                            }
                            cb(err);
                        });
                    }, function (err) {
                        if(err){
                            logger.error({msg: 'send ding ding finally failed', data: msg, user: user, err: err})
                        }
                    })
                }else{
                    logger.error({msg: 'send ding ding failed, user contact param not config', data: msg, user: user, mode: mode});
                    cbItem();
                }
            }, function () {
                
            });
        }else{
            logger.error({msg: 'try send order notify failed: user not found', user: user});
        }
    }
}

function start_process() {
    //定时检查通知
    setInterval(function () {
        check_notify();
    }, 5 * 1000);
}

module.exports.check_notify_immediately = check_notify_immediately;
module.exports.notify_immediately = notify_immediately;
module.exports.notify_receive = notify_receive;
module.exports.start_process = start_process;