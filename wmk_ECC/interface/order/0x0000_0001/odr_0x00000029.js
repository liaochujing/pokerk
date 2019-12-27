/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var OrderState = require('../../../modules/order/definition/order_state');
var db = require('../../../db');
var rdbOrder = db.ramdb.order;
var dbOrder = db.order;

function handle(req, res, body, callback) {
    var user = req.user;
    var order = rdbOrder.get_order_sync(body.serverNO, body.classID, body.id);
    if(order){
        if(order.recipient != user.id){
            callback({status: code.other, msg: '您无法处理此工单!'});
            return;
        }
        if(order.step != 1 || order.state != OrderState.processing){
            callback({status: code.other, msg: '此工单当前不可操作!'});
            return;
        }
        var roomData = undefined;
        if(order.restData){
            roomData = copy_object(order.restData.rooms);
        }
        if(roomData){
            var _dic = {};
            for(var i=0;i<body.rooms.length;i++){
                var item = body.rooms[i];
                var _data = item.data;
                for(var j=0;j<_data.length;j++){
                    var _groupItem = _data[j];
                    var key = format_key(item.serverNO, item.classID, item.id, _groupItem.module, _groupItem.group);
                    _dic[key] = _groupItem.points;
                }
            }
            var isFinished = true;
            var check_finished = function (data) {
                //TODO: check data is finished
                for(var i=0;i<data.template.length;i++){
                    var _item = data.template[i];
                    for(var _point in _item.points){
                        var _p = _item.points[_point];
                        if(!_p.signature){
                            return false;
                        }
                    }
                }
                return true;
            };
            for(var i=0;i<roomData.length;i++){
                var _roomItem = roomData[i];
                var _data = _roomItem.data;
                var _template = _data.template;

                if(_template){
                    for(var j=0;j<_template.length;j++){
                        var _templateItem = _template[j];
                        var _templateItemPoints = _templateItem.points;

                        var _recvData = _dic[format_key(_roomItem.serverNO, _roomItem.classID, _roomItem.id, _templateItem.module, _templateItem.group)];
                        if(_recvData){
                            for(var _point in _recvData){
                                var recvItem = _recvData[_point];
                                if(!IsNullOrEmpty(recvItem.time) && !IsNullOrEmpty(recvItem.value)){
                                    var _time = new Date(recvItem.time);
                                    if(_templateItemPoints[_point]){
                                        var _pointItem = _templateItemPoints[_point];
                                        if(!_pointItem.time || _time > new Date(_pointItem.time)){
                                            _pointItem.signature = body.signature;
                                            _pointItem.time = _time;
                                            _pointItem.value = recvItem.value;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if(isFinished && !check_finished(_data)){
                    isFinished = false;
                }
            }
            var now = new Date();
            var _update = {$set: {'restData.rooms': roomData}, $addToSet: {'restData.participant': body.signature}};
            if(isFinished){
                _update['$set']['restData.mTime'] = now;
            }else{
                _update['$unset'] = {'restData.mTime': 1};
            }
            dbOrder.update_order_data(order.serverNO, order.classID, order.id, _update, function (err) {
                if(err) return callback(err);

                //修改缓存数据
                order.restData.rooms = roomData;
                if(order.restData.participant.indexOf(body.signature) < 0){
                    order.restData.participant.push(body.signature);
                }
                if(isFinished){
                    order.restData.mTime = now;
                }else{
                    order.restData.mTime = undefined;
                }

                callback();
            });
        }else{
            callback({status: code.unknown});
        }
    }else{
        callback({status: code.not_found})
    }
}

module.exports.cmd = cmd.odr_0x00000029;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true},
        signature: {type: 'string', required: true},
        rooms: {
            type: 'array',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true},
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            module: {type: 'string', required: true},
                            group: {type: 'string', required: true},
                            points: {type: 'object', required: true}
                        }
                    },
                    required: true
                }
            },
            required: true
        }
    }
};