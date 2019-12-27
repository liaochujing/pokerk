/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbAlarm = db.alarm;
    var ramdb = db.ramdb;

    var query = {'parent.serverNO': body.serverNO, 'parent.classID': body.classID, 'parent.id': body.id};

    dbAlarm.aggregate([
        {$match: query},
        {$sort: {startTime: -1}},
        {$project: {
            _id: 0,
            i: ['$serverNO', '$classID', '$id', '$desc', '$level', '$startTime'],
            c: '$isConfirmed',
            et: '$endTime',//结束时间
            ft: '$force.time',//强制结束时间
            h: '$isHangup',//是否挂起
            // p: '$parent',//收敛
            s: '$star',//星标
        }}
    ], function (err, data) {
        if(err) return callback({status: code.unknown});
        if(data){
            for(var i=data.length - 1;i>=0;i--){
                var item = data[i];
                item.i[5] = item.i[5].to_unix();
                if(item.et){
                    item.et = item.et.to_unix();
                }
                if(item.ft){
                    item.ft = item.ft.to_unix();
                }
            }
        }
        
        callback(null, data);
    });
}

module.exports.cmd = cmd.alm_0x00020009;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};