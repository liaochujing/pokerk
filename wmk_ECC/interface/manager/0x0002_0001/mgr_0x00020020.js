/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbOBJID = db.objID;
var dbMinsp = db.datadb.minsp;

function handle(req, res, body, callback) {
    var user = req.user;
    dbOBJID.gen_object_id('mobile_inspection', function (err, id) {
        if(err) return callback(err);
        dbMinsp.insert_inspection(id, user.id, body.data, new Date(), function (err) {
            if(err) return callback(err);
            callback(null, {id: id});
        })
    })
}

module.exports.cmd = cmd.mgr_0x00020020;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        data: {type: 'object'}
    }
};