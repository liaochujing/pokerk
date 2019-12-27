/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;

var db = require('../../../db/index');
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = {
        energy: 0,
        en_it: 0,
        en_power: 0,
        en_cold: 0,
        en_other: 0,
        pue: 0,
        plf: 0,
        clf: 0,
        alf: 0
    };

    var get_data = function (done) {
        var startTime = new Date(body.startTime);
        var endTime = new Date(body.endTime);

        datadb.amday.aggregate([
            {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}},
            {
                $group:{
                    _id : '',
                    sen: {$first: '$energy'},
                    len: {$last: '$energy'},
                    sien: {$first: '$en_it'},
                    lien: {$last: '$en_it'},
                    spen: {$first: '$en_power'},
                    lpen: {$last: '$en_power'},
                    scen: {$first: '$en_cold'},
                    lcen: {$last: '$en_cold'},
                    soen: {$first: '$en_other'},
                    loen: {$last: '$en_other'}
                }
            }
        ],  function(err, results){
            if(err) return done(err);

            if(results && results.length > 0){
                done(null, results[0])
            }else{
                //按天未找到数据，则查询当天数据
                var startTime = new Date().GetDate().AddMinutes(-5);
                var endTime = new Date();

                datadb.amdata.aggregate([
                    {$match: {serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}},
                    {
                        $group:{
                            _id : '',
                            sen: {$first: '$energy'},
                            len: {$last: '$energy'},
                            sien: {$first: '$en_it'},
                            lien: {$last: '$en_it'},
                            spen: {$first: '$en_power'},
                            lpen: {$last: '$en_power'},
                            scen: {$first: '$en_cold'},
                            lcen: {$last: '$en_cold'},
                            soen: {$first: '$en_other'},
                            loen: {$last: '$en_other'}
                        }
                    }
                ],  function(err, results){
                    if(err) return done(err);

                    var data = undefined;
                    if(results && results.length > 0){
                        data = results[0];
                    }

                    done(null, data)
                });
            }
        });
    };

    var format_response = function (data) {
        response.energy = format_value(data.len - data.sen);
        response.en_it = format_value(data.lien - data.sien);
        response.en_power = format_value(data.lpen - data.spen);
        response.en_cold = format_value(data.lcen - data.scen);
        response.en_other = format_value(data.loen - data.soen);

        if(response.energy < 0){
            response.energy = 0;
        }
        if(response.en_it < 0){
            response.en_it = 0;
        }
        if(response.en_power < 0){
            response.en_power = 0;
        }
        if(response.en_cold < 0){
            response.en_cold = 0;
        }
        if(response.en_other < 0){
            response.en_other = 0;
        }

        if(response.energy && response.en_it){
            response.pue = format_value(response.energy / response.en_it, 3)
        }
        if(response.en_power && response.en_it){
            response.plf = format_value(response.en_power / response.en_it)
        }
        if(response.en_cold && response.en_it){
            response.clf = format_value(response.en_cold / response.en_it)
        }
        if(response.en_other && response.en_it){
            response.alf = format_value(response.en_other / response.en_it)
        }
    };

    get_data(function (err, data) {
        if(err) logger.error(err);

        if(data){
            format_response(data);
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x0000100A;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        startTime: {type: 'string', required: true},
        endTime: {type: 'string', required: true}
    }
};