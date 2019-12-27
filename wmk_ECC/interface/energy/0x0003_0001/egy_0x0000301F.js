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
var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var limit = body.limit || 15;
    var response = [];

    var startTime = undefined;
    var endTime = undefined;

    var _match = {time: {$gte: startTime, $lt: endTime}, classID: uiclassID.area};
    datadb.amday.aggregate([
        {$match: _match},
        {$group: {
            _id: {
                serverNO: '$serverNO',
                classID: '$classID',
                id: '$id'
            },
            waterUsage: {$sum: 'waterUsage'}
        }},
        {$sort: {enUsage: -1}},
        {$limit: limit}
    ], function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var area = ramdb.no.get_by_identity(item._id);
                if(area){
                    response.push({
                        serverNO: item._id.serverNO,
                        classID: item._id.classID,
                        id: item._id.id,
                        name: area.fullName,
                        waterUsage: format_value(item.waterUsage)
                    })
                }
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x0000301F;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true},
        limit: {type: 'integer'}
    }
};