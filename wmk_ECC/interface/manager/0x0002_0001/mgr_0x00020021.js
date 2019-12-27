/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    db.datadb.minsp.find_inspection({_id: body.id}, {_id: 1, user: 1, data: 1, time: 1}, function (err, results) {
        if(err) return callback(err);
        var record = undefined;
        if(results && results.length > 0){
            record = results[0];
        }
        if(record){
            callback(null, {
                id: record._id,
                user: record.user,
                data: record.data,
                time: record.time
            });
        }else{
            callback();
        }
    })
}

module.exports.cmd = cmd.mgr_0x00020021;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true}
    }
};