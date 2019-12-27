/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var privilegePoint = require('../../../definition/privilege_point');

var notifyHelper = require('../../../protocol/central/notify_helper');
var NotifyMsg = require('../../../protocol/definition/notify_message');
var NotifyType = require('../../../protocol/central/notify_type');

var db = require('../../../db');
function handle(req, res, body, callback) {
    var user = req.user;

    db.alarm.set_star(body.serverNO, body.classID, body.id, user.id, body.star, function (err, data) {
        if(err) return callback(err);

        // notifyHelper.send_notify(new NotifyMsg(NotifyType.alarm_star_changed, {serverNO: body.serverNO, classID: body.classID, id: body.id, star: body.star}));

        callback(null, {star: body.star});
    })
}

module.exports.cmd = cmd.alm_0x00000005;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        star: {type: 'number', required: true}
    }
};