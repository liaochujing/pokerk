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
    dbRTP.find_report_template({id: body.id}, {}, function (err, result) {
        if(err) return callback(err);

        var res = undefined;
        if(result && result.length > 0){
            res = result[0];
        }

        callback(null, res);
    });
}

module.exports.privilege = privilegePoint.queryReportTemplate;
module.exports.cmd = cmd.mgr_0x0001000D;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true}
    }
};