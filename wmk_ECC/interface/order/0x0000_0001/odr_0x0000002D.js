/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db');
var rdbInspectionData = db.ramdb.inspection_data;

function handle(req, res, body, callback) {
    var data = rdbInspectionData.get_by_identity(body);
    callback(null, data);
}

module.exports.cmd = cmd.odr_0x0000002D;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};