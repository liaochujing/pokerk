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

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var startTime = new Date().GetDate().AddDays(-7);
    var endTime = new Date().GetDate();

    var building = ramdb.no.get_by_identity(body);
    if(!building){
        callback(null, {});
        return;
    }
    
    var response = {
        name: building.fullName,
        dayList: [],
        pueList: [],
        plfList: [],
        clfList: [],
        alfList: []
    };

    datadb.amday.query({serverNO: body.serverNO, classID: body.classID, id: body.id, time: {$gte: startTime, $lt: endTime}}, {_id: 0, day: 1, pue: 1, plf: 1, clf: 1, alf: 1}, {time: 1}, function (err, results) {
        if(err) logger.error(err);

        if(results){
            for(var i = 0;i<results.length;i++){
                var item = results[i];

                response.dayList.push(item.day);
                response.pueList.push(item.pue || 0);
                response.plfList.push(item.plf || 0);
                response.clfList.push(item.clf || 0);
                response.alfList.push(item.alf || 0);
            }
        }

        callback(null, response);
    });
}

module.exports.cmd = cmd.cmd_0x00004012;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};