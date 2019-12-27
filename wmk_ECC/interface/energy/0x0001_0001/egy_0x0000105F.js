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
    if(roomList){
        for(var i=0;i<roomList.length;i++){
            var room = roomList[i];
            response.push({
                serverNO: room.serverNO,
                classID: room.classID,
                id: room.id,
                name: room.fullName
            })
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.cmd_0x0000105F;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};