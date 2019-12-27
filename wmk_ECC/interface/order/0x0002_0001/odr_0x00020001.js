/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var path = require('path');
var cmd = require('../cmd');
var code = require('../code');

var pathHelper = require('../../../util/path_helper');

var db = require('../../../db/index');
var dbAttachment = db.attachment;

function handle(req, res, body, callback) {
    var user = req.user;

    var attachmentID = parseInt(body.attachmentID);
    var attachmentName = body.attachmentName || ('' + attachmentID);
    var fileName = path.join(pathHelper.cachePath, attachmentName);

    dbAttachment.load_attachment(attachmentID, fileName, function (err) {
        if(err) callback({status: code.unknown});
        res.download(fileName, attachmentName);
    });
}

module.exports.cmd = cmd.odr_0x00020001;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        attachmentID: {type: 'integer', required: true},
        attachmentName: {type: 'string', required: true}
    }
};