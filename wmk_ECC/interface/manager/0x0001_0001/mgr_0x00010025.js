/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var notification = require('../../../helpers/notification_helper');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var dbLC = db.lc;
    dbLC.delete_link_control(body.id, function (err) {
        if(err) return callback(err);

        db.ramdb.lc.del_link_control(body.id);
        notification.emit(notification.Emitter.link_control, 'del', body);

        callback();
    })
}

module.exports.cmd = cmd.mgr_0x00010025;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'integer', required: true}
    }
};