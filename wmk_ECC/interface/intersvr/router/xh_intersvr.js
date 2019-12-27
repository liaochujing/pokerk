/**
 * Created by wangxh on 2018/11/28.
 */

'use strict';

var url = require('url');
var qs = require('querystring');
var express = require('express');
var router = express.Router();

var code = require('../code');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var dataServerHelper = require('../../../protocol/central/interface_helper');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');
var deviceHelper = require('../../../helpers/device_helper');
var point_type = require('../../../definition/point_type');

var db = require('../../../db');
var rdbNO = db.ramdb.no;
var dbDP = db.dp;

router.post('/get_point_value', function (req, res, next) {
    try{
        if(req.body.pointID == null || req.body.deviceID == null){
            return next({status: code.param_error});
        }
        var pointIndex = parseInt(req.body.pointID);

        let obj = get_obj_identity(req.body.deviceID);
        if(!obj){
            return next({status: code.not_found})
        }

        var no = rdbNO.get_no_sync(0, 0, obj.id);
        if(!no || !(no.classID >= uiclassID.device && no.classID <= uiclassID.lastDevice)){
            return next({status: code.not_found})
        }
        let identitys = {};
        identitys[no.id] = [pointIndex];
        dataServerHelper.get_point_value(no.serverNO, identitys, function (err, data) {
            if(err) {
                logger.error({msg: 'get point data failed', err: err});
                return sendResponse(req, res, {status: code.other, msg: 'get point data failed'});
            }
            let pv = undefined;
            if(data){
                if(data[no.id]){
                    pv = data[no.id][pointIndex];
                }
            }

            let _point = null;

            let unit = '';
            var device_type = db.ramdb.dep.get_device_type(no.type);
            if(device_type && device_type.pointList){
                for(let i=0;i<device_type.pointList.length;i++){
                    let _p = device_type.pointList[i];
                    if(_p.pointIndex == pointIndex){
                        unit = _p.unit || '';
                        _point = _p;
                        break;
                    }
                }
            }

            if(pv != null){
                if(_point != null && _point.pointType == point_type.DI){
                    let _desc = get_point_desc(_point.desc, pv);
                    if(_desc == undefined){
                        pv = '' + pv + unit;
                    }else{
                        pv = _desc;
                    }
                }else{
                    pv = '' + pv + unit;
                }
            }

            sendResponse(req, res, null, {pointValue: pv});
        })
    }catch(ex){
        return next({status: code.other, msg: ex})
    }

});

router.post('/get_list', function (req, res, next) {
    try{
        if(req.body.index == null || req.body.count == null){
            return next({status: code.param_error});
        }
        let index = parseInt(req.body.index);
        let _count = parseInt(req.body.count);

        let query = {
            classID: {$gte: uiclassID.device, $lte: uiclassID.lastDevice} 
        }

        db.no.count(query, function(err, count){
            if(err) return next({status: code.other, msg: 'get count failed'});
            let field = {
                _id: 1,
                serverNO: 1,
                classID: 1,
                id: 1,
                fullName: 1,
                'restData.system': 1
            }

            db.no.find_nameobject(query, field).skip(index).limit(_count).toArray(function(err, results){
                if(err) return next({status: code.other, msg: 'get data failed'});

                let devices = [];

                if(results && results.length > 0){
                    for(let i=0;i<results.length;i++){
                        let _device = results[i];
                        let data = {
                            name: _device.fullName,
                            system: _device.restData ? _device.restData.system : '',
                            deviceID: _device._id
                        };
                        var no = rdbNO.get_no_sync(0, 0, _device.id);
                        if(no){
                            data.path = deviceHelper.get_device_path(no);
                        }

                        devices.push(data);
                    }
                }

                sendResponse(req, res, null, {totalCount: count, device: devices});
            });
        })
    }catch(ex){
        return next({status: code.other, msg: ex})
    }
});

router.post('/get_point', function (req, res, next) {
    try{
        if(req.body.deviceID == null){
            return next({status: code.param_error});
        }

        let obj = get_obj_identity(req.body.deviceID);
        if(!obj){
            return next({status: code.not_found})
        }
        var no = rdbNO.get_no_sync(0, 0, obj.id);
        if(!no || !(no.classID >= uiclassID.device && no.classID <= uiclassID.lastDevice)){
            return next({status: code.not_found})
        }

        let points = [];
        var device_type = db.ramdb.dep.get_device_type(no.type);
        if(device_type && device_type.pointList){
            for(let i=0;i<device_type.pointList.length;i++){
                let _p = device_type.pointList[i];
                let _point = {
                    name: _p.name,
                    id: _p.pointIndex,
                    desc: _p.desc,
                    unit: _p.unit
                }
                points.push(_point);
            }
        }

        sendResponse(req, res, null, {points: points, count: points.length});
        
    }catch(ex){
        return next({status: code.other, msg: ex})
    }
});


router.use('/', function (err, req, res, next) {
    sendResponse(req, res, err);
});

function get_obj_identity(str_id){
    let obj = undefined;

    let ids = str_id.split('_');
    if(ids.length >= 3){
        let serverno = parseInt(ids[0]);
        let classid = parseInt(ids[1]);
        let id = parseInt(ids[2]);
        obj = {serverNO: serverno, classID: classid, id: id};
    }

    return obj;
}

var sendResponse = function (req, res, err, result) {
    var cmd = '';
    var status = undefined;
    var msg = undefined;

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

        logger.warn('resp req[cmd: %s, code: %s, msg: %s], time: %d ms', cmd, status, msg, Date.now() - req._startTime);
    }else{
        status = code.ok;
        msg = code.getText(status);
        logger.info('resp req[cmd: %s, code: %s], time: %d ms', cmd, status, Date.now() - req._startTime);
    }

    var response = {
        code: status,
        msg: msg,
    };

    if(result){
        for(var key in result){
            response[key] = result[key];
        }
    }

    res.send(response);
};

//获取di点描述
function get_point_desc(desc, value){
    let result = null;
    if (desc) {
        var dic = {};
        var array = desc.split(';');
        for (var i = 0; i < array.length; i++) {
            var item = array[i];
            var array2 = item.split(',');
            if (array2.length > 1) {
                dic[array2[0]] = array2[1];
            }
        }

        result = dic[value];
    }
    return result;
}

module.exports = router;