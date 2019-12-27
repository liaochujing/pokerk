/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;

function handle(req, res, body, callback) {
    var rooms = areaHelper.get_data_room(body);

    var response = [];
    if(rooms){
        for(var i=0;i<rooms.length;i++){
            var room = rooms[i];
            response.push({serverNO: room.serverNO, classID: room.classID, id: room.id, name: room.fullName});
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.cpy_0x00000004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};