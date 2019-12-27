/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;

    var ramdb = db.ramdb;
    var dbNO = ramdb.no;
    var dbNOR = ramdb.nor;

    var identity = body.identity;
    var classIDs = body.childs;

    var res = [];

    var childs = undefined;
    if(classIDs && classIDs.length > 0){
        childs = dbNOR.get_child_identity_list(identity.serverNO, identity.classID, identity.id, classIDs);
    }else{
        childs = dbNOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
    }

    if(childs && childs.length > 0){
        for(var i in childs){
            var child = childs[i];
            var no = dbNO.get_by_identity(child);
            if(no){
                res.push({serverNO: no.serverNO, classID: no.classID, id: no.id, fullName: no.fullName, description: no.description});
            }
        }
    }

    callback(null, res);
}

module.exports.cmd = cmd.itr_0x00000003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        identity: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            },
            required: true
        },
        childs: {
            type: 'array',
            items: {
                type: 'number'
            }
        }
    }
};