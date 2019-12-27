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

var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');
var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var match = {serverNO: body.serverNO, classID: body.classID, id: body.id};
    var now = new Date();

    var _start = 0;
    var _end = 0;
    var power = 0;
    function get_previous_energy(done) {
        var startTime = now.GetMonth().AddDays(-1);
        var endTime = now.GetDate();
        match.time = {$gte: startTime, $lt: endTime};

        datadb.rmday.aggregate([
            {$match: match},
            {$group: {
                _id: '',
                start: {$first: '$energy'},
                end: {$last: '$energy'}
            }},
            {$sort: {time: 1}}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results && results.length > 0){
                var record = results[0];
                _start = record.start;
                _end = record.end;
            }

            done();
        });
    }

    function get_today_energy(done) {
        var startTime = now.GetDate();
        var endTime = now;
        match.time = {$gte: startTime, $lt: endTime};

        datadb.rmdata.aggregate([
            {$match: match},
            {$group: {
                _id: '',
                start: {$first: '$energy'},
                end: {$last: '$energy'}
            }},
            {$sort: {time: 1}}
        ], function (err, results) {
            if(err) logger.error(err);

            if(results && results.length > 0){
                var record = results[0];
                if(_start == 0){
                    _start = record.start;
                }
                if(record.end){
                    _end = record.end;
                }
            }
            var data = realTimeProcessor.get_area_data_cache(body);
            if(data && data.energy){
                _end = data.energy;
            }
            power = data.power;

            done();
        });
    }

    get_previous_energy(function () {
        get_today_energy(function () {
            callback(null, {enUsage: format_value(_end - _start), power: power})
        })
    })
}

module.exports.cmd = cmd.cmd_0x00004023;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};