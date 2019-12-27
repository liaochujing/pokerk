/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var serverHelper = require('../../../protocol/central/interface_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var rdbNO = ramdb.no;
var rdbNOR = ramdb.nor;

function handle(req, res, body, callback) {
    var rooms = undefined;
    if(body.classID == uiclassID.room){
        rooms = [body];
    }else{
        rooms = rdbNOR.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.room);
    }

    if(rooms && rooms.length > 0){
        var _dic = {};
        var points = [];
        for(var i=0;i<rooms.length;i++){
            var room = rdbNO.get_by_identity(rooms[i]);
            if(room && room.statePoint){
                points.push(room.statePoint);
                _dic[room.id] = room.statePoint;
            }
        }

        if(points && points.length > 0){
            serverHelper.get_point_value_list(points, function (err, data) {
                if(err) logger.error({msg: 'get room state point value failed', err: err});

                var pvData = data;
                if(!pvData){
                    pvData = {};
                }
                var response = [];
                for(var i=0;i<rooms.length;i++){
                    var room = rooms[i];
                    var state = 0;
                    
                    var statePoint = _dic[room.id];
                    if(statePoint && pvData[statePoint.serverNO] && pvData[statePoint.serverNO][statePoint.id]){
                        state = pvData[statePoint.serverNO][statePoint.id][statePoint.pointIndex] || 0
                    }
                    response.push({serverNO: room.serverNO, classID: room.classID, id: room.id, state: state})
                }

                callback(null, response);
            });
        }else{
            callback(null, rooms);
        }
    }else{
        callback();
    }
}

module.exports.cmd = cmd.itr_0x00000041;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};