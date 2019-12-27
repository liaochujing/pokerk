/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var ah = require('../../../util/array_helper');
var uiclassID = require('../../../definition/uiClassID');
var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var dbCDP = db.cdp;

function handle(req, res, body, callback) {
    var identity = body;

    var rcno = db.ramdb.cno;
    var rdbCDT = db.ramdb.cdt;

    var device = rcno.get_by_identity(body);
    if(device){
        var response = [];

        var get_template_point = function (done) {
            if(device.type){
                var template = rdbCDT.get_collect_device_type(device.type);
                if(template){
                    response = response.concat(template.pointList);
                }
            }

            done();
        };

        var get_config_point = function (done) {
            dbCDP.find_collect_device_point({serverNO: body.serverNO, classID: body.classID, id: body.id}, {_id: 0, serverNO: 0, classID: 0, id: 0, time: 0}, function (err, results) {
                if(err) return done(err);

                var _dic = {};
                for(var i=0;i<response.length;i++){
                    var _p = response[i];
                    _dic[_p.pointIndex] = i;
                }

                if(results){
                    for(var i=0;i<results.length;i++){
                        var _p = results[i];
                        var index = _dic[_p.pointIndex];
                        if(index !== undefined){
                            response[index] = _p;
                        }else{
                            response.push(_p);
                        }
                    }
                }

                done();
            })
        };

        ah.series([get_template_point, get_config_point], function (err) {
            if(err) return callback(err);

            // //采集器默认添加在线点
            // if(response.length == 0 && device.classID == uiclassID.collector){
            //     response.push({
            //         pointIndex: 1,
            //         name: '在线点',
            //         desc: ''
            //     })
            // }

            callback(null, response);
        })
    }else{
        callback({status: code.not_found, msg: 'device not found'});
    }
}

module.exports.cmd = cmd.itr_0x00000007;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};