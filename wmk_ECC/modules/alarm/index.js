/**
 * Created by wangxh on 2017/10/11.
 */

'use strict';

var logger = require('../../util/log_manager').logger;
var notifyHelper = require('../../protocol/central/notify_helper');
var NotifyType = require('../../protocol/central/notify_type');

var alarm_helper = require('./processor/alarm_helper');
var alarm_server_procesor = require('./processor/alarm_server_procesor');
var alarm_static_prossor = require('./processor/alarm_static_processor');
var alarm_notify_processor = require('./processor/alarm_notify_processor');
var alarm_schedule_processor = require('./processor/alarm_schedule_processor');
var server_state_processor = require('./processor/server_state_processor');
var alarm_aom_processor = require('./processor/alarm_aom_processor');

function init(done) {
    //检查服务器告警
    alarm_server_procesor.start_process();
    //告警统计
    alarm_static_prossor.start_static();
    //告警通知
    alarm_notify_processor.start_process();
    //定时通知
    alarm_schedule_processor.start_process();
    //开始监控服务状态
    server_state_processor.start_process();
    //开始监控服务状态
    alarm_aom_processor.start_process();

    notifyHelper.on_server_notify(function (msg) {
        var data = msg.data;
        switch(msg.type){
            case NotifyType.alarm_manual_end:
                alarm_helper.alarm_ended(data);
                break;
            case NotifyType.alarm_generated:
                alarm_helper.alarm_gen(data);
                break;
            case NotifyType.alarm_ended:
                alarm_helper.alarm_ended(data);
                break;
            case NotifyType.alarm_force_end:
                alarm_helper.alarm_force_ended(data);
                break;
            case NotifyType.alarm_confirmed:
                alarm_helper.alarm_confirmed(data);
                break;
            case NotifyType.alarm_hangup:
                alarm_helper.alarm_hanguped(data);
                break;
            case NotifyType.alarm_unhangup:
                alarm_helper.alarm_unhanguped(data);
                break;
            case NotifyType.alarm_convergenced:
                var _list = data.list;
                if(_list && _list.length > 0){
                    for(var i=0;i<_list.length;i++){
                        alarm_helper.alarm_convergenced(_list[i]);
                    }
                }
                break;
            default:
                break;
        }
    });

    var plug_ins = require('../../helpers/plug_in_config').alarm;
    if(plug_ins && plug_ins.length > 0){
        for(let i=0;i<plug_ins.length;i++){
            let name = plug_ins[i];
            try{
                let module = require('./plug-in/' + name);
                module.run();
            }catch(err){
                if(err) logger.error({msg: 'load plug-in failed', module: name})
            }
        }
    }

    done();
}

module.exports.init = init;