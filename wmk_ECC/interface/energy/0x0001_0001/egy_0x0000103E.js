/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;

var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var keyList = [];

    var data = realTimeProcessor.get_area_data_cache(body);

    response.push({
        name: '10KV输入功率',
        power: data ?  data.plhi || 0 : 0
    });
    response.push({
        name: '10KV输出功率',
        power: data ?  data.plho || 0 : 0
    });
    response.push({
        name: '380KV输入功率',
        power: data ?  data.plai || 0 : 0
    });
    response.push({
        name: '380KV输出功率',
        power: data ?  data.plao || 0 : 0
    });
    response.push({
        name: '末端配电输入功率',
        power: data ?  data.plei || 0 : 0
    });
    response.push({
        name: '末端配电输出功率',
        power: data ?  data.pleo || 0 : 0
    });

    callback(null, response);
}

module.exports.cmd = cmd.cmd_0x0000103E;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};