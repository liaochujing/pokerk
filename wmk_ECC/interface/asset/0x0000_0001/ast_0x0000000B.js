/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var uiclassID = require('../../../definition/uiClassID');
var logger = require('../../../util/log_manager').logger;
var objectHelper = require('../../../objects/object_helper');

function handle(req, res, body, callback) {
    var customer = objectHelper.createNameObject(uiclassID.customer);

    customer.id = body.id;

    customer.delete_db(function (err) {
        if(err){
            logger.error(err);
            callback({status: code.unknown, msg: err.message});
        }else{
            callback();
        }
    });
}

module.exports.privilege = PrivilegePoint.removeAsset;
module.exports.cmd = cmd.ast_0x0000000B;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
    }
};