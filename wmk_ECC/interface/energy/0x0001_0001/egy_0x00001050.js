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

        var count = 0;
        var cabLIst = ramdb.nor.get_child_identity_range(room.serverNO, room.classID, room.id, uiclassID.cabinet);
        if(cabLIst){
            count = cabLIst.length;
        }

        response.push({name: room.fullName, value: count});
    }

    callback(null, response);
}

module.exports.cmd = cmd.cmd_0x00001050;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};