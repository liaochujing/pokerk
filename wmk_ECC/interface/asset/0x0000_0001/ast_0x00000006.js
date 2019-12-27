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
    var supplier = objectHelper.createNameObject(uiclassID.supplier);

    supplier.id = body.id;
    supplier.name = body.name;
    supplier.fullName = body.fullName;
    supplier.contacts = body.contacts;
    supplier.tel = body.tel;
    supplier.fax = body.fax;
    supplier.postalCode = body.postalCode;
    supplier.location = body.location;
    supplier.website = body.website;
    supplier.deviceType = body.deviceType;
    supplier.state = body.state;
    supplier.desc = body.desc;

    supplier.update_db(function (err) {
        if(err){
            logger.error(err);
            callback({status: code.unknown, msg: err.message});
        }else{
            callback();
        }
    });
}

module.exports.privilege = PrivilegePoint.modifyAsset;
module.exports.cmd = cmd.ast_0x00000006;
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
        deviceType: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    system: {type: 'number', required: true},
                    group: {type: 'number', required: true}
                }
            },
            required: true},
        state: {type: 'number', required: true},
        desc: {type: 'string', required: true}
    }
};