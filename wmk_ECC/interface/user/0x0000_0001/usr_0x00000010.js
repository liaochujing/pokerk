/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var ramdb = db.ramdb;

    var privilegeList = ramdb.privilege.get_privilege_list();

    callback(null, privilegeList);
}

module.exports.cmd = cmd.usr_0x00000010;
module.exports.handle = handle;