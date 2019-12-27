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
    let list = rdbNOR.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.device, uiclassID.lastDevice);
    if(list){
        let points = [];
        for(let i=0;i<list.length;i++){
            let item = list[i];
            points.push({serverNO: item.serverNO, classID: item.classID, id: item.id, pointIndex: 1});
        }
        serverHelper.get_point_value_list(points, function (err, data) {
            if(err) return callback(err);

            let response = {total: points.length, online: 0, offline: 0, unknown: 0, error: 0};
            for(let i=0;i<points.length;i++){
                let _p = points[i];
                let _v = undefined;
                if(data[_p.serverNO] && data[_p.serverNO][_p.id]){
                    _v = data[_p.serverNO][_p.id][_p.pointIndex];
                }
                if(_v != undefined){
                    if(_v == 1){
                        response.online++;
                    }else if(_v == 0){
                        response.offline++;
                    }else{
                        response.error++;
                    }
                }else{
                    response.unknown++;
                }
            }

            callback(null, response);
        })
    }else{
        callback();
    }
}

module.exports.cmd = cmd.itr_0x00000042;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};