/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var db = require('../../../db/index');
var ramdb = db.ramdb;

var alarm_static_processor = require('../../../modules/alarm/processor/alarm_static_processor');

function handle(req, res, body, callback) {
    alarm_static_processor.get_alarm_count_month(function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var device = ramdb.no.get_by_identity(item);
                if(device){
                    item.name = device.fullName;
                }else{
                    item.name = '未知设备'
                }
            }
        }

        callback(null, results);
    });
}

module.exports.cmd = cmd.alm_0x00020005;
module.exports.handle = handle;