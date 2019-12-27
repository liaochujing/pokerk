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
    if(rdbPST.get_type(body.id)){
        callback({status: code.other, msg: '类型已存在'});
        return;
    }
    
    var now = new Date();
    dbPST.insert_parts_type(body.id, body.name, body.desc, now, function (err) {
        if(err) return callback(err);

        rdbPST.set_type({
            id: body.id,
            name: body.name,
            desc: body.desc,
            createTime: now,
            modifyTime: now
        });

        callback();
    })
}

module.exports.cmd = cmd.ast_0x00000020;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        name: {type: 'string', required: true},
        desc: {type: 'string'}
    }
};