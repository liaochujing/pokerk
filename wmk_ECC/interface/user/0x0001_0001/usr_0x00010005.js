/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var wst = db.wst;

    var sheetID = body.sheetID;
    wst.find_work_sheet({sheetID: sheetID}, {_id: 0}, function (err, results) {
        if(err) return callback({status: code.unknown});
        if(results && results.length > 0){
            var res = results[0];
            callback(null, res);
        }else{
            callback({status: code.not_found, msg: 'work sheet not found'});
        }
    });
}

module.exports.cmd = cmd.usr_0x00010005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        sheetID: {type: 'number', required: true}
    }
};