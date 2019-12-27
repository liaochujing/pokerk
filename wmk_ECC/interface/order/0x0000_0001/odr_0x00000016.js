/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var path = require('path');
var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbAttachment = db.attachment;

function handle(req, res, body, callback) {
    var user = req.user;

    var attachmentID = parseInt(body.attachmentID);
    dbAttachment.get_attachment(attachmentID, function (err, data) {
        if(err) return callback(err);
        callback(null, data);
    });
}

module.exports.cmd = cmd.odr_0x00000016;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        attachmentID: {type: 'integer', required: true}
    }
};