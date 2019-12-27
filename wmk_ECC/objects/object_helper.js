/**
 * Created by wangxh on 2017/7/26.
 */

'use strict';

var util = require('util');
var logger = require('../util/log_manager').logger;
var uiclassID = require('../definition/uiClassID');

var nameObjectDic = {};

var cDeviceTemplate = require('./collect/cDeviceTemplate');
var DeviceTemplate = require('./device/DeviceTemplate');

function init() {
    //tree
    nameObjectDic[uiclassID.area] = require('./tree/Area');
    nameObjectDic[uiclassID.park] = require('./tree/Park');
    nameObjectDic[uiclassID.building] = require('./tree/Building');
    nameObjectDic[uiclassID.floor] = require('./tree/Floor');
    nameObjectDic[uiclassID.room] = require('./tree/Room');
    nameObjectDic[uiclassID.rowCabinet] = require('./tree/RowCabinet');
    nameObjectDic[uiclassID.province] = require('./tree/Province');
    nameObjectDic[uiclassID.city] = require('./tree/City');

    //collect device
    nameObjectDic[uiclassID.cArea] = require('./collect/cArea');
    nameObjectDic[uiclassID.cDevice] = require('./collect/cDevice');
    nameObjectDic[uiclassID.cBaDevice] = require('./collect/cBaDevice');
    nameObjectDic[uiclassID.cBaIPDevice] = require('./collect/cBaIPDevice');
    nameObjectDic[uiclassID.cS80Device] = require('./collect/cS80Device');
    nameObjectDic[uiclassID.collector] = require('./collect/Collector');

    //device
    nameObjectDic[uiclassID.device] = require('./device/Device');
    nameObjectDic[uiclassID.ENTH] = require('./device/ENTH');
    nameObjectDic[uiclassID.Temp] = require('./device/Temp');
    nameObjectDic[uiclassID.cabinet] = require('./device/Cabinet');

    //general device
    nameObjectDic[uiclassID.nvr] = require('./device/Nvr');
    nameObjectDic[uiclassID.ipc] = require('./device/Ipc');
    nameObjectDic[uiclassID.generalDoor] = require('./device/GeneralDoor');
    nameObjectDic[uiclassID.acc_controller] = require('./device/AccessController');

    //opertaor
    nameObjectDic[uiclassID.admin] = require('./user/Administrator');
    nameObjectDic[uiclassID.operator] = require('./user/Operator');

    var operator_group = require('./user/OperatorGroup');
    nameObjectDic[uiclassID.operatorGroup] = operator_group;
    nameObjectDic[uiclassID.adminGroup] = operator_group;
    //asset
    nameObjectDic[uiclassID.asset] = require('./asset/Asset');
    nameObjectDic[uiclassID.parts] = require('./asset/Part');
    nameObjectDic[uiclassID.customer] = require('./asset/Customer');
    nameObjectDic[uiclassID.supplier] = require('./asset/Supplier');

    //order
    nameObjectDic[uiclassID.alarmOrder] = require('./order/AlarmOrder');
    nameObjectDic[uiclassID.assetOrder] = require('./order/AssetOrder');
    nameObjectDic[uiclassID.drillOrder] = require('./order/DrillOrder');
    nameObjectDic[uiclassID.inspectionOrder] = require('./order/InspectionOrder');
    nameObjectDic[uiclassID.onPowerOrder] = require('./order/OnPowerOrder');
    nameObjectDic[uiclassID.offPowerOrder] = require('./order/OffPowerOrder');
    nameObjectDic[uiclassID.customOrder] = require('./order/CustomOrder');
}

init();

function createNameObject(classID) {
    var nameObject = null;
    
    var constructor = nameObjectDic[classID];
    if (constructor == undefined) {
        if(classID >= uiclassID.device && classID <= uiclassID.lastDevice){
            constructor = DeviceTemplate(classID);
            nameObjectDic[classID] = constructor;
        }else if(classID >= uiclassID.cDevice && classID <= uiclassID.lastCObject){
            constructor = cDeviceTemplate(classID);
            nameObjectDic[classID] = constructor;
        }
    }
    if(constructor){
        nameObject = new constructor();
    }

    if (nameObject) {
        nameObject.classID = classID;
    }else{
        logger.error('create name object {classID:%d} failed', classID);
    }

    return nameObject;
}


module.exports.createNameObject = createNameObject;