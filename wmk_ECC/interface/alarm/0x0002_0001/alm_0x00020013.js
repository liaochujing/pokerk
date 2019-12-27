/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;

var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var ramdb = db.ramdb;
    
    var msg = new DataMessage(CentralCMD.cen_0x00030001, {points: body.points, startTime: body.startTime, endTime: body.endTime});
    dataHelper.send(msg, function (err, data) {
        if(err) logger.error({msg: 'get point data failed', err: err});

        if(data){
            for(var i=0;i<data.length;i++){
                var _item = data[i];

                var device = ramdb.no.get_no_sync(_item.serverNO, _item.classID, _item.id);
                if(device){
                    var _p = ramdb.dep.get_device_type_point(device.type, _item.pointIndex);
                    if(_p){
                        _item.name = _p.name;
                        _item.unit = _p.unit;
                    }
                }
            }
        }

        callback(null, data);
    });
}

module.exports.cmd = cmd.alm_0x00020013;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        points: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true},
                    pointIndex: {type: 'number', required: true}
                }
            }
        },
        startTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true},
        endTime: {type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}', required: true}
    }
};