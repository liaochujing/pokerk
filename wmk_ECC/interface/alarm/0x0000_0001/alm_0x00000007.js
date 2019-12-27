/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var alarm_aom_processor = require('../../../modules/alarm/processor/alarm_aom_processor');

function handle(req, res, body, callback) {
    alarm_aom_processor.clear_alarm();
    callback();
}

module.exports.cmd = cmd.alm_0x00000007;
module.exports.handle = handle;