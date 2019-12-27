/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var realTimeDataProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var room = ramdb.no.get_by_identity(body);
    if(!room){
        callback(null, {});
        return;
    }

    var response = {
        serverNO: room.serverNO,
        classID: room.classID,
        id: room.id,
        name: room.fullName,
        pue: 0,
        cTemp: 0
    };

    var data = realTimeDataProcessor.get_area_data_cache(room);
    if(data){
        response.pue = data.pue || 0;
        response.cTemp = data.cTemp || 0;
    }

    callback(null, response)
}

module.exports.cmd = cmd.cmd_0x00004020;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};