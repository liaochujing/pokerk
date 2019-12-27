/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var rdbNO = db.ramdb.no;
// var rdbOO = db.ramdb.oo;
var rdbCNO = db.ramdb.cno;

var uiclassID = require('../../../definition/uiClassID');

function handle(req, res, body, callback) {
    var res = undefined;

    if(body.classID >= uiclassID.cObject && body.classID <= uiclassID.lastCObject){
        var obj = rdbCNO.get_by_identity(body);
        if(obj){
            res = {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, description: obj.description};
        }
    }else{
        var obj = rdbNO.get_by_identity(body);
        if(obj){
            res = {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, description: obj.description};
        }
    }

    callback(null, res);
}

module.exports.cmd = cmd.itr_0x00000009;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'integer', required: true},
        classID: {type: 'integer', required: true},
        id: {type: 'integer', required: true}
    }
};