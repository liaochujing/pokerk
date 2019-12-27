/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var privilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbRTP = db.rtp;
    // 增加areaID查询
    dbRTP.find_report_template({areaID:body.areaID}, {id: 1, type: 1, cmd: 1, name: 1, desc: 1}, function (err, result) {
        if(err) return callback(err);
        callback(null, result);
    });
}

module.exports.cmd = cmd.mgr_0x0001000E;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        areaID: {type: 'string', required: true}
    }
};