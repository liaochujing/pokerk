/**
 * Created by wangxh on 2018/11/28.
 */

'use strict';

var url = require('url');
var qs = require('querystring');
var express = require('express');
var router = express.Router();
var ah = require('../../../util/array_helper');
var code = require('../code');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var dataServerHelper = require('../../../protocol/central/interface_helper');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');
var dataServerHelper = require('../../../protocol/central/interface_helper');


var db = require('../../../db');
var rdbNOR =db.ramdb.nor;
var rdbNO = db.ramdb.no;
var rdbDEP = db.ramdb.dep;
// var rdbDP = db.ramdb.dp;
var dbDP = db.dp;
var rdbCNO = db.ramdb.cno;


router.use('/', function (req, res, next) {
    var arg = url.parse(req.url).query;
    var body = qs.parse(arg);
    req.body = body;

    next();

});

router.get('/point_value', function (req, res, next) {
    var id = parseInt(req.body.id);
    var no = rdbNO.get_no_sync(0, 0, id);
    if(!no || !(no.classID >= uiclassID.device && no.classID <= uiclassID.lastDevice)){
        return next({status: code.not_found})
    }

    dbDP.find_device_point({deviceServerNO: no.serverNO, deviceClassID: no.classID, deviceID: no.id}, {_id: 0, fullName: 1, pointIndex: 1}, function (err, points) {
        if(err) return next(err);

        dataServerHelper.get_device_point_value({serverNO: no.serverNO, classID: no.classID, id: no.id}, function (err, data) {
            if(err) return next(err);
            var _dic = {};
            if(data){
                for(var i=0;i<data.length;i++){
                    var item = data[i];
                    _dic[item.i] = item;
                }
            }

            var resp = [];
            for(var i=0;i<points.length;i++){
                var _p = points[i];
                var _item = _dic[_p.pointIndex] || {};
                resp.push({index: _p.pointIndex, name: _p.fullName, value: _item.v, time: new Date(_item.t)})
            }

            sendResponse(req, res, null, resp)
        });
    });
});

router.get('/his_point_value', function (req, res, next) {
    var id = parseInt(req.body.id);
    var no = rdbNO.get_no_sync(0, 0, id);
    if(!no || !(no.classID >= uiclassID.device && no.classID <= uiclassID.lastDevice)){
        return next({status: code.not_found})
    }
    var startTime = new Date(req.body.from);
    var endTime = new Date(req.body.to);
    if(isNaN(startTime.getTime()) || isNaN(endTime.getTime())){
        return next({status: code.other, msg: 'time invalid'})
    }
    var interval = endTime.getTime() - startTime.getTime();
    if(interval < 0){
        return next({status: code.other, msg: 'time error'})
    }
    if(interval > 24 * 60 * 60 * 1000){
        return next({status: code.other, msg: 'time is too long'})
    }

    dbDP.find_device_point({deviceServerNO: no.serverNO, deviceClassID: no.classID, deviceID: no.id}, {_id: 0, fullName: 1, pointIndex: 1}, function (err, points) {
        if(err) return next(err);
        var _points = [];

        for(var i=0;i<points.length;i++){
            var _p = points[i];
            _points.push({serverNO: no.serverNO, classID: no.classID, id: no.id, pointIndex: _p.pointIndex})
        }

        var msg = new DataMessage(CentralCMD.cen_0x00030001, {
            points: _points,
            startTime: startTime.format_datetime(),
            endTime: endTime.format_datetime()
        });
        dataHelper.send(msg, function (err, data) {
            if(err) return next(err);

            if(data){
                var resp = [];
                for(var i=0;i<data.length;i++){
                    var item = data[i];
                    resp.push({index: item.pointIndex, list: item.list})
                }
                sendResponse(req, res, null, resp);
            }else{
                sendResponse(req, res, null, []);
            }
        });
    });
});


router.get('/room_info_by_area', function (req, res, next) {
    //通过projectID获取room信息
    var resp = [];

    var find_room = function (area) {
        var children = rdbNOR.get_child_identity_range(area.serverNO,area.classID,area.id,uiclassID.area,uiclassID.room);
        if (!children ||children.length ==0){
            return;
        }
        for (var i = 0; i < children.length; i++){
            var child_identity = children[i];
            var child_info = rdbNO.get_by_identity(child_identity);
            if (child_info.classID == uiclassID.room){
                var child_info_res = {};
                child_info_res.roomID = child_info.serverNO.toString()+'-'+child_info.classID.toString()+'-'+child_info.id.toString();
                child_info_res.fullName = child_info.fullName;
                child_info_res.name = child_info.name;
                child_info_res.system = child_info.system;
                // child_info_res.serverNO = child_info.serverNO;
                // child_info_res.classID = child_info.classID;
                // child_info_res.id = child_info.id;
                resp.push(child_info_res)
            }
            else{
                find_room(child_info);
            }
        }
    }


    var projectID = req.body.projectID;
    if (!projectID){
        return next({status:code.param_error});
    }
    var area_list = rdbNO.get_by_class(uiclassID.area);
    var area = undefined;
    for (var j = 0; j < area_list.length; j ++){
        if (area_list[j].projectID == projectID){
            area = area_list[j];
            break;
        }
    }
    if (area){
        find_room(area);
        sendResponse(req, res, null, resp)
    }
    else {
        sendResponse(req,res,null,[])
    }

});

router.get('/device_info_by_room', function (req, res, next) {
    var _point_value_dic = {};


    //通过roomID  serverNO-classID-id   获取device信息
    var roomID = req.body.roomID;
    if (!roomID){
        return next({status:code.param_error});
    }
    var room_info = roomID.split('-');
    var room_serverNO = room_info[0];
    var room_classID = room_info[1];
    var room_id = room_info[2];
    if (!room_serverNO || !room_classID || !room_id){
        return next({status:code.param_error});
    }
    var room = rdbNO.get_no_sync(room_serverNO,room_classID,room_id);
    var device_list = rdbNOR.get_child_identity_range(room.serverNO,room.classID,room.id,uiclassID.device,uiclassID.lastDevice);
    var resp = [];
    var _alarm_list = [];
    var _alarm_dic = {};
    var _device_point_dic = {};
    if (device_list){
        var get_point_value = function (device,cb) {
            dataServerHelper.get_device_point_value({serverNO:device.serverNO,classID:device.classID,id:device.id}, function (err,data) {
                var key = device.serverNO.toString()+'-'+device.classID.toString()+'-' + device.id.toString();
                if (err){
                    _point_value_dic[key] = [];
                }
                else {
                    _point_value_dic[key] = data;
                }
                cb();
            });
        };


        ah.each_series(device_list,get_point_value,function (err) {
            if (err){
                logger.error("error geting point value: ", err);
            }

            var query_list = [];
            for (var i = 0; i < device_list.length; i++){
                var no = device_list[i];
                query_list.push({deviceServerNO: no.serverNO, deviceClassID: no.classID, deviceID: no.id});
            }

            dbDP.find_device_point({$or:query_list},{},function (err,result) {
                if (err) {
                    logger.error(err);
                    return next({status:code.other,msg:err});
                }
                for (var i = 0; i < result.length; i ++){
                    var record = result[i];
                    if (!_device_point_dic[record.deviceServerNO]){
                        _device_point_dic[record.deviceServerNO] = {}
                    }
                    if (!_device_point_dic[record.deviceServerNO][record.deviceID]){
                        _device_point_dic[record.deviceServerNO][record.deviceID] = []
                    }
                    _device_point_dic[record.deviceServerNO][record.deviceID].push(record)
                }  //使用dic替代缓存获取

                for (var m = 0; m < device_list.length; m++){
                    var device= device_list[m];
                    var device_info = rdbNO.get_by_identity(device);
                    var device_info_res = {};
                    var value_key = device.serverNO.toString()+'-'+device.classID.toString()+'-' + device.id.toString();
                    // device_info_res.pointValue = _point_value_dic[value_key];
                    var point_value_list = _point_value_dic[value_key];
                    var _point_value_dic_index = {};
                    if (point_value_list && point_value_list.length > 0){
                        for (var k = 0; k <point_value_list.length; k++){
                            _point_value_dic_index[point_value_list[k].i] = point_value_list[k].v
                        }
                    }

                    device_info_res.deviceFullID = device_info.serverNO.toString() + '-' + device_info.classID.toString() + '-' + device_info.id.toString();
                    device_info_res.fullName = device_info.fullName;
                    device_info_res.name = device_info.name;
                    device_info_res.aNO = device_info.aNO;
                    device_info_res.deviceTypeID = device_info.type.system.toString() + '-' + device_info.type.group.toString() + '-' + device_info.type.id.toString();

                    var device_type = rdbDEP.get_device_type(device_info.type);
                    device_info_res.device_type = {};
                    device_info_res.device_type.name = device_type.name;
                    device_info_res.device_type.systemName = device_type.systemName;
                    device_info_res.device_type.groupName = device_type.groupName;
                    // var device_point = rdbDP.get_point_by_device(device_info);
                    var device_point = _device_point_dic[device_info.serverNO][device_info.id];
                    device_info_res.pointList = [];
                    device_info_res.collectDevice = null;
                    for (var j = 0; j < device_point.length; j++){
                        var point = {};

                        point.pointIndex = device_point[j].pointIndex;
                        point.pointValue = _point_value_dic_index[point.pointIndex];
                        if (!device_info_res.collectDevice && device_point[j].binding){
                            var collector_identity = device_point[j].binding;
                            var collector = rdbCNO.get_by_identity(collector_identity);
                            if (collector){
                                device_info_res.collectDevice = {};
                                device_info_res.collectDevice.fullName = collector.fullName;
                                device_info_res.collectDevice.id = collector.id;
                            }
                        };
                        point.fullName = device_point[j].fullName;
                        point.unit = device_point[j].unit;
                        point.alarm = [];
                        if (device_point[j].config.alarm && device_point[j].config.alarm.length>0){
                            for (var i = 0; i<device_point[j].config.alarm.length; i++ ){
                                if (!_alarm_dic[device_point[j].config.alarm[i].id]){
                                    var alarm = {};
                                    alarm.id =device_point[j].config.alarm[i].id;
                                    point.alarm.push(alarm);
                                    _alarm_dic[alarm.id] = alarm;
                                    _alarm_list.push(alarm.id);
                                }
                                else {
                                    point.alarm.push(_alarm_dic[device_point[j].config.alarm[i].id])
                                }
                            }
                        }


                        device_info_res.pointList.push(point);
                    };
                    resp.push(device_info_res);

                }
                db.alp.find_alarm_type({id:{$in:_alarm_list}},{},function (err,result) {
                    if (err){
                        logger.error("error in finding alarm name: ", err);
                    }
                    if (result && result.length >0){
                        for (var i = 0; i < result.length; i ++){
                            _alarm_dic[result[i].id].name = result[i].name
                        }
                    }
                    sendResponse(req, res, null, resp)
                })

            });

        })




    }else {
        sendResponse(req,res,null,[]);
    }
});

router.get('/device_info_by_id', function (req, res, next) {
    //通过deviceFullID  serverNO-classID-id获取设备信息

    //TODO 点值信息
    var deviceID = req.body.deviceFullID;
    if (!deviceID){
        return next({status:code.param_error});
    }
    var id_list = deviceID.split('-');
    var device_serverNO = id_list[0];
    var device_classID = id_list[1];
    var device_id = id_list[2];
    if (!device_serverNO || !device_classID || !device_id){
        return next({status:code.param_error});
    }
    var resp = [];
    var device_info = rdbNO.get_no_sync(device_serverNO,device_classID,device_id);
    if (device_info){

        dataServerHelper.get_device_point_value({serverNO:device_info.serverNO,classID:device_info.classID,id:device_info.id}, function (err,data) {
            if(err){
                logger.error('获取实时点值失败： ',err);
            }
            var _pv_dic = {};
            for (var k = 0; k < data.length; k ++){
                _pv_dic[data[k].i] = data[k].v
            }
            var device_info_res = {};
            // device_info_res.pointValue = data;
            device_info_res.deviceFullID = deviceID;
            device_info_res.fullName = device_info.fullName;
            device_info_res.name = device_info.name;
            device_info_res.aNO = device_info.aNO;
            device_info_res.deviceTypeID = device_info.type.system.toString() + '-' + device_info.type.group.toString() + '-' + device_info.type.id.toString();
            var device_type = rdbDEP.get_device_type(device_info.type);
            device_info_res.device_type = {};
            device_info_res.device_type.name = device_type.name;
            device_info_res.device_type.systemName = device_type.systemName;
            device_info_res.device_type.groupName = device_type.groupName;
            // var device_point = rdbDP.get_point_by_device(device_info);
            dbDP.find_device_point({deviceServerNO: parseInt(device_serverNO), deviceClassID: parseInt(device_classID), deviceID:parseInt(device_id)},{},function (err,result) {
                if (err) {
                    logger.error(err);
                    next({status: code.other, msg: err});
                }
                //获取第一个设备点的点采集设备

                var device_point = result;
                device_info_res.pointList = [];
                var _alarm_list = [];
                var _alarm_dic = {};
                device_info_res.collectDevice = null;
                for (var j = 0; j < device_point.length; j++){
                    var point = {};
                    point.pointIndex = device_point[j].pointIndex;
                    if (!device_info_res.collectDevice && device_point[j].binding){
                        var collector_identity = device_point[j].binding;
                        var collector = rdbCNO.get_by_identity(collector_identity);
                        if (collector){
                            device_info_res.collectDevice = {};
                            device_info_res.collectDevice.fullName = collector.fullName;
                            device_info_res.collectDevice.id = collector.id;
                        }
                    };
                    point.pointValue = _pv_dic[point.pointIndex];
                    point.fullName = device_point[j].fullName;
                    point.unit = device_point[j].unit;
                    point.alarm = [];

                    if (device_point[j].config.alarm && device_point[j].config.alarm.length>0){
                        for (var i = 0; i<device_point[j].config.alarm.length; i++ ){
                            if (!_alarm_dic[device_point[j].config.alarm[i].id]){
                                var alarm = {};
                                alarm.id =device_point[j].config.alarm[i].id;
                                point.alarm.push(alarm);
                                _alarm_dic[alarm.id] = alarm;
                                _alarm_list.push(alarm.id);
                            }
                            else {
                                point.alarm.push(_alarm_dic[device_point[j].config.alarm[i].id])
                            }
                        }
                    }
                    device_info_res.pointList.push(point);
                };
                db.alp.find_alarm_type({id:{$in:_alarm_list}},{},function (err,result) {
                    if (err){
                        logger.error("error in finding alarm name: ", err);
                    }
                    if (result && result.length >0){
                        for (var i = 0; i < result.length; i ++){
                            _alarm_dic[result[i].id].name = result[i].name
                        }
                    }
                    resp.push(device_info_res);
                    sendResponse(req, res, null, resp)
                });
            });

        });
    }
    else{
        sendResponse(req, res, null, resp)
    }
});


router.get('/alarm_info_by_type', function (req, res, next) {
    //alarm id获取alarm信息

    var alarm_type_id = parseInt(req.body.id);
    if (!alarm_type_id){
        return next({status:code.param_error});
    }

    db.alp.find_alarm_type({id:alarm_type_id},{},function (err,result) {
        var resp = [];
        resp.push(result);
        sendResponse(req, res, null, resp)
    })

});

router.get('/device_type_by_id', function (req, res, next) {
    //通过deviceTypeID获取type信息    device.type.system-device.type.gourp.device.type.id
    var TypeID = req.body.deviceTypeID;
    if (!TypeID){
        return next({status:code.param_error});
    }
    var id_list = TypeID.split('-');
    var type_system = id_list[0];
    var type_group = id_list[1];
    var type_id = id_list[2];
    if (!type_system || !type_group || !type_id){
        return next({status:code.param_error});
    }
    var resp = [];
    var res_info = {};
    var device_type = rdbDEP.get_device_type({system:type_system,group:type_group,id:type_id});
    if (device_type){
        res_info.deviceTypeID = TypeID;
        res_info.fullName = device_type.name;
        res_info.pointList = [];
        var point_list = device_type.pointList;
        var _alarm_list = [];
        var _alarm_dic = {};
        for (var i = 0; i <point_list.length; i++){
            var point = {};
            point.pointIndex = point_list[i].pointIndex;
            point.name = point_list[i].name;
            point.unit = point_list[i].unit;
            point.desc = point_list[i].desc;
            point.precision = point_list[i].option.transform.precision;
            point.alarm = [];
            var alarm_list = point_list[i].config.alarm;
            if (alarm_list && alarm_list.length>0){
                for (var j = 0; j<alarm_list.length; j++)
                {
                    var alarm_id = alarm_list[j].id;
                    if (!_alarm_dic[alarm_id]){
                        var alarm = {};
                        alarm.id = alarm_id;
                        point.alarm.push(alarm);
                        _alarm_list.push(alarm_id);
                        _alarm_dic[alarm_id] = alarm;
                    }
                    else{
                        point.alarm.push(_alarm_dic[alarm_id]);
                    }
                    // var alarm_type = rdbALP.get_alarm_type(alarm_id);
                    // point.alarm.push({id:alarm_id,name:alarm_type.name})
                }
            }
            res_info.pointList.push(point);
        }
        resp.push(res_info);
        db.alp.find_alarm_type({id:{$in:_alarm_list}},{},function (err,result) {
            if (err){
                logger.error("error in finding alarm name: ", err);
            }
            if (result && result.length >0){
                for (var i = 0; i < result.length; i ++){
                    _alarm_dic[result[i].id].name = result[i].name
                }
            }
            sendResponse(req, res, null, resp)
        });
        // sendResponse(req, res, null, resp);
    }
    else{
        sendResponse(req, res, null, []);
    }

});


router.get('/device_type_all', function (req, res, next) {
    //获取所有逻辑模板信息
    var resp = [];
    var device_type_list = rdbDEP.get_all_device_type();
    var _alarm_list = [];
    var _alarm_dic = {};
    for(var m = 0; m < device_type_list.length; m++) {
        var device_type = device_type_list[m];
        var res_info = {};
        res_info.deviceTypeID = device_type.system.toString() + '-' + device_type.group.toString() +'-' + device_type.id.toString();
        res_info.fullName = device_type.name;
        res_info.pointList = [];
        var point_list = device_type.pointList;
        for (var i = 0; i < point_list.length; i++) {
            var point = {};
            point.pointIndex = point_list[i].pointIndex;
            point.name = point_list[i].name;
            point.unit = point_list[i].unit;
            point.desc = point_list[i].desc;
            point.precision = point_list[i].option.transform.precision;
            point.alarm = [];
            var alarm_list = point_list[i].config.alarm;
            if (alarm_list && alarm_list.length > 0) {
                for (var j = 0; j < alarm_list.length; j++) {
                    var alarm_id = alarm_list[j].id;
                    if (!_alarm_dic[alarm_id]){
                        var alarm = {};
                        alarm.id =alarm_id;
                        point.alarm.push(alarm);
                        _alarm_dic[alarm.id] = alarm;
                        _alarm_list.push(alarm.id);
                    }
                    else {
                        point.alarm.push(_alarm_dic[alarm_id])
                    }
                }
            }
            res_info.pointList.push(point);
        }

        resp.push(res_info);
    }
    db.alp.find_alarm_type({id:{$in:_alarm_list}},{},function (err,result) {
        if (err){
            logger.error("error in finding alarm name: ", err);
        }
        if (result && result.length >0){
            for (var i = 0; i < result.length; i ++){
                _alarm_dic[result[i].id].name = result[i].name
            }
        }
        sendResponse(req, res, null, resp)
    });
    //
    // sendResponse(req, res, null, resp)
});







router.use('/', function (err, req, res, next) {
    sendResponse(req, res, err);
});

var sendResponse = function (req, res, err, result) {
    var cmd = '';
    var status = undefined;
    var msg = undefined;
    var message = undefined;
    if(req.headers){
        cmd = req.headers['cmd'];
    }
    if(err){
        if(err.status == undefined){
            status = code.unknown;
        }else{
            status = err.status
        }
        msg = err.msg || code.getText(status);
        message = err.message;

        logger.warn('resp req[cmd: %s, code: %s, msg: %s], time: %d ms', cmd, status, msg, Date.now() - req._startTime);
    }else{
        status = code.ok;
        msg = code.getText(status);
        logger.info('resp req[cmd: %s, code: %s], time: %d ms', cmd, status, Date.now() - req._startTime);
    }

    var response = {
        code: status,
        msg: msg,
        message: message,
        data: result
    };

    res.send(response);
};

module.exports = router;