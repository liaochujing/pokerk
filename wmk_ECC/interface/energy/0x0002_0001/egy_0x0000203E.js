/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var st = require('../../../util/small_tools');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

function handle(req, res, body, callback) {
    var response = [];

    var rowList = areaHelper.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.rowCabinet);
    if(rowList){
        for(var i=0;i<rowList.length;i++){
            var rowCab = ramdb.no.get_by_identity(rowList[i]);
            if(rowCab){
                response.push({
                    name: rowCab.fullName,
                    value: rowCab.id
                })
            }
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.cmd_0x0000203E;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};