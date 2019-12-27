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

var db = require('../../../db/index');

function handle(req, res, body, callback) {

    var pageIndex = body.pageIndex || 0;
    var pageSize = body.pageSize || 1000;
    if(pageSize > 1000){
        pageSize = 1000;
    }else if(pageSize < 0){
        pageSize = 1000;
    }

    var query = {};
    if(body.name != undefined){
        query.name = {$regex: body.name};
    }
    if(body.state != undefined){
        query.state = body.state;
    }
    
    var total = 0;
    var dbSupplier = db.supplier;
    dbSupplier.count(query, function (err, count) {
        if(err) logger.error(err);
        if(count){
            total = count;
        }

        dbSupplier.find_supplier(query, {_id: 0}).sort({createTime: -1}).skip(pageIndex * pageSize).limit(pageSize).exec(function (err, results) {
            if(err) logger.error(err);

            var list = [];
            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    list.push({
                        id: item.id,
                        name: item.name,
                        fullName: item.fullName,
                        contacts: item.contacts,
                        tel: item.tel,
                        fax: item.fax,
                        postalCode: item.postalCode,
                        location: item.location,
                        website: item.website,
                        deviceType: item.deviceType,
                        state: item.state,
                        desc: item.desc
                    })
                }
            }

            callback(null, {total: total, pageIndex: pageIndex, pageSize: pageSize, list: list});
        });
    });
}

module.exports.privilege = PrivilegePoint.queryAsset;
module.exports.cmd = cmd.ast_0x00000008;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        pageIndex: {type: 'number'},
        pageSize: {type: 'number'},

        name: {type: 'string'},
        state: {type: 'number'}
    }
};