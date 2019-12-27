/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');

function handle(req, res, body, callback) {
    var response = [];
    var key = body.key;

    for(var i=0;i<body.list.length;i++){
        var obj = body.list[i];

        if(obj.classID >= uiclassID.area && obj.classID <= uiclassID.lastArea){
            var _data = realTimeProcessor.get_area_data_cache(obj);
            if(_data){
                if(key){
                    obj.value = _data[key];
                    response.push(obj);
                }else{
                    response.push(_data)
                }
            }
        }else{
            var _data = realTimeProcessor.get_device_data_cache(obj);
            if(_data){
                if(key){
                    obj.value = _data[key];
                    response.push(obj);
                }else{
                    response.push(_data)
                }
            }
        }
    }

    callback(null, response);
}

module.exports.cmd = cmd.cmd_0x00003011;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        list: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    serverNO: {type: 'number', required: true},
                    classID: {type: 'number', required: true},
                    id: {type: 'number', required: true}
                }
            },
            required: true
        },
        key: {type: 'string', required: true}
    }
};