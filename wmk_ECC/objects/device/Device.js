/**
 * Created by wangxh on 2017/7/19.
 */
'use strict';

var ah = require('../../util/array_helper');
var st = require('../../util/small_tools');
var logger = require('../../util/log_manager').logger;
var def = require('../../definition/constants');
var uiclassID = require('../../definition/uiClassID');
var NameObject = require('../NameObject');

var pointHelper = require('./../point/point_helper');

var db = require('../../db/index');

var base = NameObject.prototype;

function Device() {
    //变量
    this.serverNO = defaultServerNO;
    this.classID = uiclassID.device;
}

Device.prototype = new NameObject();

Device.prototype._schema = {
    base: base._schema,
    extend: {
        //基础信息
        type: 'object',//设备模板

        system: 'string',
        //容量配置
        // ratedPower: 'number',//额定功率
        // ratedColdPower: 'number',//额定制冷功率
        // ratedElec: 'number',//额定电流
        // ratedCold: 'number',//额定制冷量
        // ratedLoad: 'number',//额定负荷
        // ratedInPower: 'number',//输入额定功率
        // ratedOutPower: 'number',//输出额定功率
        // ratedInElec: 'number',//输出额定电流
        // ratedOutElec: 'number',//输出额定电流

        //能耗统计点
        points: 'object',//统计点

        //告警屏蔽
        shield: 'object',

        //物理信息
        aNO: 'string',//资产编号
        model: 'string',//型号
        supplier: 'string',//厂家
        pdDate: 'string',//投产日期
        ratedPower: 'string',//额定功率
        mcycle: 'string',//维保周期
        wlife: 'string',//过保年限
    }
};

// Device.prototype.update_db = function (callback) {
//     var self = this;
//     base.update_db.call(this, function (err) {
//         if(err) return callback(err);
//         callback();
//     })
// };

Device.prototype.delete_db = function (callback) {
    var self = this;
    base.delete_db.call(this, function (err) {
        if(err) return callback(err);
        self.clear_point_list(callback);
    })
};

Device.prototype.gen_point_list = function (points, callback) {
    var self = this;
    if(!self.type){
        return callback();
    }

    var _type = db.ramdb.dep.get_device_type(self.type);
    if(_type && _type.pointList){
        var pointList = _type.pointList;
        if(pointList && pointList.length > 0){
            var dic = {};
            if(points && points.length > 0){
                for(var i=0;i<points.length;i++){
                    var record = points[i];
                    dic[record.pointIndex] = record;
                }
            }
            var resultPointList = [];
            for(var i=0;i<pointList.length;i++){
                var item = pointList[i];
                var _point = pointHelper.createDevicePoint(item.classID || uiclassID.devicePoint);

                _point.serverNO = self.serverNO;
                _point.classID = item.classID || uiclassID.devicePoint;
                _point.pointIndex = item.pointIndex;
                _point.pointType = item.pointType;
                _point.deviceServerNO = self.serverNO;
                _point.deviceClassID = self.classID;
                _point.deviceID = self.id;

                _point.fullName = item.name;
                _point.description = item.desc;
                _point.unit = item.unit;

                var _configTime = undefined;
                var _pointConfig = dic[item.pointIndex];
                if(_pointConfig){
                    // _point.config = _pointConfig.config || {};
                    if(_pointConfig.config){
                        _point.config = {};
                        if(_pointConfig.config.alarm){
                            _point.config.alarm = _pointConfig.config.alarm;
                        }
                        if(_pointConfig.config.value){
                            _point.config.value = {};
                            if(_pointConfig.config.value.from){
                                _point.config.value.from = _pointConfig.config.value.from;
                            }
                            if(_pointConfig.config.value.expression){
                                _point.config.value.expression = {
                                    formula: _pointConfig.config.value.expression.formula,
                                    source: _pointConfig.config.value.expression.source
                                };
                            }
                        }
                    }else{
                        _point.config = {};
                    }

                    if(_pointConfig.binding){
                        _point.binding = _pointConfig.binding;
                    }
                    if(_pointConfig.option){
                        _point.option = _pointConfig.option;
                    }
                    if(_pointConfig.time){
                        _configTime = new Date(_pointConfig.time);
                    }
                }else{
                    if(item.config){
                        _point.config = {};
                        if(item.config.alarm){
                            _point.config.alarm = item.config.alarm;
                        }
                        if(item.config.value){
                            _point.config.value = {};
                            if(item.config.value.from){
                                _point.config.value.from = item.config.value.from;
                            }
                            if(item.config.value.expression){
                                _point.config.value.expression = {
                                    formula: item.config.value.expression.formula,
                                    source: item.config.value.expression.source
                                };
                            }
                        }
                    }else{
                        _point.config = {};
                    }
                    if(item.binding){
                        _point.binding = item.binding;
                    }
                    if(item.option){
                        _point.option = item.option;
                    }
                }

                //表达式解析
                if(_point.config && _point.config.value && _point.config.value.expression){
                    var formula = _point.config.value.expression.formula;
                    if(formula){
                        formula = formula.replace(/serverNO/g, '' + self.serverNO);
                        formula = formula.replace(/id/g, '' + self.id);
                        _point.config.value.expression.formula = formula;
                    }
                }

                _point.createTime = _configTime || self.createTime || new Date();
                _point.modifyTime = _configTime || self.modifyTime || new Date();

                _point.id = self.format_point_id(_point);

                resultPointList.push(_point);
            }

            var dbDP = db.dp;
            dbDP.batch_insert_devicepoint(resultPointList, function (err) {
                if(err) return callback(err);
                callback(undefined, resultPointList)
            });
        }else{
            callback();
        }
    }else{
        callback();
    }
};

Device.prototype.regen_point_list = function (points, callback) {
    var self = this;
    self.clear_point_list(function (err) {
        if(err) return callback(err);
        self.gen_point_list(points, callback);
    })
};

Device.prototype.format_point_id = function (point) {
    var _type = this.type;

    var system = _type.system;
    var group = _type.group;
    var id = _type.id;

    var serverNO = this.serverNO;
    var deviceID = this.id;
    var type = point.pointType;
    var index = point.pointIndex;

    // var strID = '' + system + st.pad_left(group, 2) + st.pad_left(id, 2) + st.pad_left(serverNO, 1) + st.pad_left(deviceID, 3) + type + st.pad_left(index, 3);
    var strID = '' + serverNO + st.pad_left(deviceID, 6) + type + st.pad_left(index, 4);
    return parseInt(strID);
};

Device.prototype.clear_point_list = function (callback) {
    var dbDP = db.dp;
    dbDP.clear_devicepoint({deviceServerNO: this.serverNO, deviceClassID: this.classID, deviceID: this.id}, callback);
};

Device.prototype.load_from_json = function (jObject) {
    var restData = jObject.restData;
    if(restData){
        var shield = restData.shield;
        if(shield){
            if(typeof shield.start == 'string'){
                shield.start = new Date(shield.start);
            }
            if(typeof shield.end == 'string'){
                shield.end = new Date(shield.end);
            }
        }
    }
    base.load_from_json.call(this, jObject);
};

module.exports = Device;