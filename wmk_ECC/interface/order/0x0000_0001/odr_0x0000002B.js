/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var OrderAction = require('../../../modules/order/definition/order_action_type');
var db = require('../../../db');
var dbNO = db.no;
var rdbInspectionData = db.ramdb.inspection_data;
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var user = req.user;
    dbNO.update_nameobject_config(body.serverNO, body.classID, body.id, '_inspection_template', {guid: body.guid, data: body.data}, function (err) {
        if(err) return callback(err);

        rdbInspectionData.update_inspection_data(body.serverNO, body.classID, body.id, body.guid, body.data);
        var room = db.ramdb.no.get_by_identity(req.body);
        if(room){
            dbOPL.insert_user_log(OrderAction.set_inspection_content, user, '编辑:' + room.fullName + ' 巡检内容', req.body, new Date());
        }

        callback();
    });
}

module.exports.cmd = cmd.odr_0x0000002B;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        guid: {type: 'string', required: true},
        data: {type: 'object', required: true}
    }
};