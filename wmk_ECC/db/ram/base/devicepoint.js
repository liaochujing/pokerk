/**
 * Created by wangxh on 2017/9/22.
 */

'use strict';

var util = require('util');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('./../../../definition/uiClassID');
var table_adapter = require('./../table_adapter');

var pointHelper = require('../../../objects/point/point_helper');

var db = require('../../index');
var dbDP = db.dp;

function devicepoint_adapter() {
    var self = this;

    self.tb_name = 'devicepoint';

    self.dp_dic = {};
    // self.bdp_dic = {};
    self.dp_device_dic = {};
}

util.inherits(devicepoint_adapter, table_adapter);

devicepoint_adapter.prototype.init = function (param, callback) {
    var self = this;
    param = param || {};
    var query = param.query || {};
    var fields = param.fields || {};
    self._query = query;
    self._fields = fields;

    dbDP.find_point(query, fields, function (results) {
        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var _point = pointHelper.createDevicePoint(item.classID || uiclassID.devicePoint);
                if(!_point){
                    logger.error({msg: 'init device point failed', info: item});
                    continue;
                }
                _point.init_from_row(item);
                self.set_point(_point);
            }
        }
    }, function (err) {
        if (err) return callback(err);

        callback();
    });
};

devicepoint_adapter.prototype.reload_device_point = function (identity, callback) {
    var self = this;
    var query = self._query;
    query.deviceServerNO = identity.serverNO;
    query.deviceClassID = identity.classID;
    query.deviceID = identity.id;
    var fields = self._fields;
    dbDP.find_device_point(query, fields, function (err, results) {
        if(err) {
            callback(err);
            return;
        }

        //删除原有设备点缓存
        delete self.dp_dic[identity.id];
        // var arr = self.dp_device_dic[identity.id];
        // if(arr){
        //     for(var i=0;i<arr.length;i++){
        //         var point = arr[i];
        //         if(point.binding && point.binding.id != undefined){
        //             var binding = point.binding;
        //             var _bp = self.bdp_dic[binding.serverNO][binding.id][binding.pointIndex];
        //             if(_bp.length){
        //                 var index = _bp.indexOf(point);
        //                 if(index >= 0){
        //                     _bp.splice(index, 1);
        //                 }else{
        //                     logger.warn({msg: 'unknown error point not found', point: point, arr: _bp});
        //                 }
        //             }else{
        //                 delete self.bdp_dic[binding.serverNO][binding.id][binding.pointIndex];
        //             }
        //         }
        //     }
        // }
        delete self.dp_device_dic[identity.id];

        if(results){
            for(var i=0;i<results.length;i++){
                var item = results[i];
                var _point = pointHelper.createDevicePoint(item.classID || uiclassID.devicePoint);
                if(!_point){
                    logger.error({msg: 'init device point failed', info: item});
                    continue;
                }
                _point.init_from_row(item);
                self.set_point(_point);
            }
        }

        callback();
    })
};

devicepoint_adapter.prototype.set_point = function (point) {
    var self = this;

    if(!self.dp_dic[point.deviceID]){
        self.dp_dic[point.deviceID] = {};
    }
    self.dp_dic[point.deviceID][point.pointIndex] = point;

    if(!self.dp_device_dic[point.deviceID]){
        self.dp_device_dic[point.deviceID] = [];
    }
    self.dp_device_dic[point.deviceID].push(point);

    // if(point.binding && point.binding.id != undefined){
    //     var binding = point.binding;
    //     if(!self.bdp_dic[binding.serverNO]){
    //         self.bdp_dic[binding.serverNO] = {};
    //     }
    //     if(!self.bdp_dic[binding.serverNO][binding.id]){
    //         self.bdp_dic[binding.serverNO][binding.id] = {};
    //     }
    //     var _bp = self.bdp_dic[binding.serverNO][binding.id][binding.pointIndex];
    //     if(_bp){
    //         if(_bp.length){
    //             _bp.push(point);
    //         }else{
    //             self.bdp_dic[binding.serverNO][binding.id][binding.pointIndex] = [_bp, point];
    //         }
    //     }else{
    //         self.bdp_dic[binding.serverNO][binding.id][binding.pointIndex] = point;
    //     }
    // }
};

devicepoint_adapter.prototype.get_point_by_device = function (identity) {
    return this.dp_device_dic[identity.id];
};

devicepoint_adapter.prototype.clear_point_by_device = function (identity) {
    delete this.dp_dic[identity.id];
    delete this.dp_device_dic[identity.id];
};

devicepoint_adapter.prototype.get_point_sync = function (serverNO, classID, id, pointIndex) {
    // if(pointIndex == undefined){
    //     pointIndex = id;
    //     id = classID;
    // }
    var _tmp = this.dp_dic[id];
    if(_tmp != undefined){
        return _tmp[pointIndex];
    }
    return undefined;
};

devicepoint_adapter.prototype.get_all_point = function () {
    return this.dp_dic;
};

// devicepoint_adapter.prototype.get_binding_point_sync = function (serverNO, classID, id, pointIndex) {
//     if(this.bdp_dic[serverNO]){
//         if(this.bdp_dic[serverNO][id]){
//             return this.bdp_dic[serverNO][id][pointIndex];
//         }
//     }
//     return undefined;
// };

module.exports = devicepoint_adapter;