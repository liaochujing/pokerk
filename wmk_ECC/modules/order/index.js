/**
 * Created by wangxh on 2017/11/8.
 */

'use strict';

var notifyHelper = require('../../protocol/central/notify_helper');
var NotifyType = require('../../protocol/central/notify_type');

var orderProcessor = require('./processor/order_processor');
var orderNotifyProcessor = require('./processor/order_notify_processor');
var orderScheduleProcessor = require('./processor/order_schedule_processor');

function init(done) {
    notifyHelper.on_server_notify(function (msg) {
        var data = msg.data;
        switch(msg.type){
            case NotifyType.alarm_generated:
                orderProcessor.process_alarm_gen(data);
                break;
            case NotifyType.alarm_manual_end:
            case NotifyType.alarm_ended:
                orderProcessor.process_alarm_end(data);
                break;
            default:
                break;
        }
    });

    orderNotifyProcessor.start_process();
    orderScheduleProcessor.start_process();
    
    done();
}

module.exports.init = init;