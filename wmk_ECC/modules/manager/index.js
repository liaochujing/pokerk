/**
 * Created by wangxh on 2017/12/28.
 */

'use strict';

var logger = require('../../util/log_manager').logger;

function init(done) {
    
    //系统运行状态监控
    var system_monitor = require('./monitor/system_state_monitor');
    system_monitor.start_monitor_service_state();

    setTimeout(function () {
        var link_control_processor = require('./processor/link_control_processor');
        link_control_processor.run();
    }, 1000);

    // var db = require('../../db');
    // var ramdb = db.ramdb;
    // var rdbDP = ramdb.dp;
    //
    // var CentralNotifyHelper = require('../../protocol/central/notify_helper');
    // var CentralNotifyType = require('../../protocol/central/notify_type');
    // CentralNotifyHelper.on_server_notify(function (msg) {
    //     switch(msg.type){
    //         case CentralNotifyType.device_point_modified:
    //             var data = msg.data;
    //             if(data.reload){
    //                 rdbDP.reload_device_point(data, function (err) {
    //                     if(err){
    //                         logger.error({msg: 'sync notify reload device point failed', data: data, err: err});
    //                         return;
    //                     }
    //                 })
    //             }else{
    //                 var points = msg.data.points;
    //                 if(points && points.length > 0){
    //                     for(var i=0;i<points.length;i++){
    //                         var _point = points[i];
    //                         var point = rdbDP.get_point_sync(data.serverNO, data.classID, data.id, _point.pointIndex);
    //                         if(point){
    //                             point.config = _point.config || {};
    //                             point.binding = _point.binding;
    //                         }
    //                     }
    //                 }
    //             }
    //             break;
    //         default:
    //             break;
    //     }
    // });

    done();
}

module.exports.init = init;