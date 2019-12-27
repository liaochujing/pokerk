/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;

var realTimeDataHelper = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = {
        current: 0,
        list: []
    };

    var get_real_time_value = function (done) {
        var data = realTimeDataHelper.get_area_data_cache(body);
        if(data){
            response.current = data.cop;
        }

        done();
    };

    var get_his_time_value = function (done) {
        var startTime = new Date().GetDate().AddDays(-7);
        var endTime = new Date().GetDate();

        datadb.amday.aggregate([
            {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}},
            {$group: {
                _id: '$day',
                value: {$avg: '$cop'}
            }}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];

                    response.list.push({
                        day: item._id,
                        value: item.value
                    })
                }
            }

            done();
        })
    };

    ah.series([get_real_time_value, get_his_time_value], function () {
        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00003005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};