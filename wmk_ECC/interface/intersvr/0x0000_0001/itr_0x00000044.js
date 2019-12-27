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
    let points = [];
    for(let i=0;i<body.length;i++){
        let item = body[i];
        points.push({serverNO: item.serverNO, classID: item.classID, id: item.id, pointIndex: 1});
    }
    serverHelper.get_point_value_list(points, function (err, data) {
        if(err) return callback(err);

        let response = [];
        for(let i=0;i<points.length;i++){
            let _p = points[i];
            let _v = undefined;
            if(data[_p.serverNO] && data[_p.serverNO][_p.id]){
                _v = data[_p.serverNO][_p.id][_p.pointIndex];
            }
            let _state = -1;
            if(_v !== undefined){
                if(_v == 1){
                    _state = 1;
                }else if(_v == 0){
                    _state = 0;
                }else{
                    _state = -2;
                }
            }
            response.push({serverNO: _p.serverNO, classID: _p.classID, id: _p.id, state: _state})
        }

        callback(null, response);
    })
}

module.exports.cmd = cmd.itr_0x00000044;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            serverNO: {type: 'number', required: true},
            classID: {type: 'number', required: true},
            id: {type: 'number', required: true}
        }
    }
};