/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbPST = db.pst;
var rdbPST = db.ramdb.pst;

function handle(req, res, body, callback) {
    var _type = rdbPST.get_type(body.id);
    if(!_type){
        callback({status: code.not_found});
        return;
    }
    var now = new Date();
    dbPST.update_parts_type(body.id, body.name, body.desc, now, function (err) {
        if(err) return callback(err);

        rdbPST.set_type({
            id: body.id,
            name: body.name,
            desc: body.desc,
            createTime: _type.createTime,
            modifyTime: now
        });

        callback();
    })
}

module.exports.cmd = cmd.ast_0x00000021;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        name: {type: 'string', required: true},
        desc: {type: 'string'}
    }
};