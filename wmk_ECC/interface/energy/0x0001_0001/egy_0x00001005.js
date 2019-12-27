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
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var startTime = new Date().GetDate().AddDays(-7);
    var endTime = new Date().GetDate();

    datadb.amday.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {day: 1, pue: 1, alf: 1, clf: 1, plf: 1}, function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];

                response.push({
                    day: item.day,
                    pue: item.pue,
                    alf: item.alf,
                    clf: item.clf,
                    plf: item.plf
                })
            }
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.cmd_0x00001005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};