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
    customer.name = body.name;
    customer.fullName = body.fullName;
    customer.contacts = body.contacts;
    customer.tel = body.tel;
    customer.fax = body.fax;
    customer.postalCode = body.postalCode;
    customer.location = body.location;
    customer.website = body.website;
    customer.state = body.state;
    customer.desc = body.desc;

    customer.update_db(function (err) {
        if(err){
            logger.error(err);
            callback({status: code.unknown, msg: err.message});
        }else{
            callback();
        }
    });
}

module.exports.privilege = PrivilegePoint.modifyAsset;
module.exports.cmd = cmd.ast_0x0000000A;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        id: {type: 'number', required: true},
        name: {type: 'string', required: true},
        fullName: {type: 'string', required: true},
        contacts: {type: 'string', required: true},
        tel: {type: 'string', required: true},
        fax: {type: 'string', required: true},
        postalCode: {type: 'string', required: true},
        location: {type: 'string', required: true},
        website: {type: 'string', required: true},
        state: {type: 'number', required: true},
        desc: {type: 'string', required: true}
    }
};