/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var startTime = new Date(body.startTime);
    var endTime = new Date(body.endTime);

    callback({status: code.not_found});
    // var response = [];
    //
    // var dbData = db.datadb.dmdata;
    // ah.each_series(body.sources, function (identity, cbItem) {
    //     var device = ramdb.no.get_by_identity(identity);
    //     if(device){
    //         dbData.query({serverNO: device.serverNO, classID: device.classID, id: device.id, time: {$gte: startTime, $lt: endTime}}, {_id: 0, energy: 1, time: 1}, {time: 1}, function (err, results) {
    //             if(err) logger.error(err);
    //
    //             var deviceItem = {
    //                 serverNO: device.serverNO,
    //                 classID: device.classID,
    //                 id: device.id,
    //                 name: device.fullName,
    //                 data: []
    //             };
    //             if(results &&  results.length > 0){
    //                 //间隔扩大到小时
    //                 var max_interval = 60 * 60 * 1000;//一个小时
    //                 var _item = results[0];
    //                 var _time = _item.time;
    //                 var _interval = 0;
    //                 deviceItem.data.push(_item);
    //
    //                 for(var i=1;i<results.length;i++){
    //                     var item = results[i];
    //
    //                     var interval = item.time - _time;
    //                     if(interval > max_interval){
    //                         if(max_interval - _interval > interval - max_interval){
    //                             deviceItem.data.push(item);
    //                             _time = item.time;
    //                         }else{
    //                             if(i!=1){
    //                                 deviceItem.data.push(_item);
    //                             }
    //                             _time = item.time;
    //                         }
    //                         _interval = 0;
    //                     }else{
    //                         _interval = interval;
    //                     }
    //                     _item = item;
    //                 }
    //             }
    //             response.push(deviceItem);
    //
    //             cbItem();
    //         });
    //     }else{
    //         cbItem();
    //     }
    // }, function () {
    //     callback(null, response);
    // });
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010071;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        sources: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true}
                }
            }
        },
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};