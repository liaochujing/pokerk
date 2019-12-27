/**
 * Created by wangxh on 2017/10/25.
 */

'use strict';

var hisProcessor = require('./processor/his_data_processor');
var realTimeProcessor = require('./processor/real_time_data_processor');

function init(done) {
    //监控实时数据
    realTimeProcessor.start_monitor();
    //计算历史书籍
    hisProcessor.start_static_data();

    done();
}

module.exports.init = init;