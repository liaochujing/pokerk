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

    var roomList = areaHelper.get_data_room(body);
    for(var i=0;i<roomList.length;i++){
        var room = roomList[i];

        var acCount = 0;
        var cabCount = 0;

        var aConList = areaHelper.get_child_identity_list(room.serverNO, room.classID, room.id, uiclassID.AC_List);
        if(aConList){
            acCount = aConList.length;
        }
        
        var cabLIst = areaHelper.get_child_identity_range(room.serverNO, room.classID, room.id, uiclassID.cabinet);
        if(cabLIst){
            cabCount = cabLIst.length;
        }

        response.push({
            name: room.fullName,
            ac: acCount,
            cab: cabCount
        });

    }

    callback(null, response);
}

module.exports.cmd = cmd.cmd_0x00001055;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};