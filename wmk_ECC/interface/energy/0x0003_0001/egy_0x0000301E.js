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
        power: 0,
        water_flow: 0,
        in_water: 0,
        out_water: 0,
        list: []
    };

    var get_real_time_value = function (done) {
        var data = realTimeDataHelper.get_area_data_cache(body);
        if(data){
            response.current = data.cop;
            response.power = data.power;
            response.water_flow = data.water_flow;
            response.in_water = data.in_water;
            response.out_water = data.out_water;
        }

        done();
    };

    var get_his_time_value = function (done) {
        var startTime = new Date().GetDate().AddDays(-7);
        var endTime = new Date().GetDate();

        datadb.amday.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {_id: 0, day: 1, cop: 1}, function (err, results) {
            if(err) logger.error(err);

            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];

                    response.list.push({
                        day: item.day,
                        value: item.cop || 0
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

module.exports.cmd = cmd.cmd_0x0000301E;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};