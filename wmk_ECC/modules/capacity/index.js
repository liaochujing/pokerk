/**
 * Created by wangxh on 2018/2/23.
 */

'use strict';

var cabinetOpenProcessor = require('./processor/cabinet_open_processor');
var realTimeProcessor = require('./processor/real_time_data_processor');

function init(done) {

    cabinetOpenProcessor.start_process();
    realTimeProcessor.start_monitor();

    done();
}

module.exports.init = init;