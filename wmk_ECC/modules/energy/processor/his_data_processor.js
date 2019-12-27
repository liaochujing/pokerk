/**
 * Created by wangxh on 2017/10/25.
 */

'use strict';

var st = require('../../../util/small_tools');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;

var uiclassID = require('../../../definition/uiClassID');
var deviceHelper = require('../../../helpers/device_helper');
var areaHelper = require('../../../helpers/area_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var datadb = db.datadb;

const KEEP_DAYS = 2;
const FIND_LAST_DAYS = -1;

var _nowTime = undefined;

var pad_left = function (n, length) {
    var str = '' + n;
    for(var i=1;i<length;i++){
        str = str[i] ? str : '0' + str;
    }
    return str;
};

function format_day_key(time) {
    return '' + time.getFullYear() + pad_left(time.getMonth() + 1, 2) + pad_left(time.getDate(), 2);
}

function format_mon_key(time) {
    return '' + time.getFullYear() + pad_left(time.getMonth() + 1, 2);
}

function format_year_key(time) {
    return '' + time.getFullYear();
}

function format_object_key() {
    var res = '';
    for(var i in arguments){
        if(res){
            res+='_'
        }
        res+=arguments[i];
    }
    return res
}

function try_each_series_day(list, func, callback) {
    var _days = KEEP_DAYS;

    var static_one = function (item, callback) {
        if(_days > 0){
            var startTime = _nowTime.AddDays(-_days);
            func(item, startTime, function () {
                _days--;
                static_one(item, callback);
            })
        }else{
            callback();
        }
    };

    ah.each_series(list, function (item, cbItem) {
        _days = KEEP_DAYS;
        static_one(item, cbItem);
    }, function () {
        callback();
    });
}



function _static_device_data_day(device, startTime, callback) {
    var _config = deviceHelper.get_device_type_config(device);
    if(!_config || !_config.mPoints){
        callback();
        return;
    }
    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        areaID: {type: 2}//区域ID
    };
    var mPoints = {};
    var _pointsConfig = _config.mPoints;
    for(var key in _pointsConfig){
        if(!config[key]){
            var item = _pointsConfig[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    var dayKey = format_day_key(startTime);

    datadb.dmday.exists_cache({serverNO: device.serverNO, classID: device.classID, id: device.id, day: dayKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists){
            var endTime = startTime.AddDays(1);

            var hasData = false;
            var query = {serverNO: device.serverNO, classID: device.classID, id: device.id, time: {$gte: startTime, $lt: endTime}};
            datadb.dmdata.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }

                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static device data failed', err: err});
                }

                if(hasData){
                    datadb.dmdata.find_last_cache({serverNO: device.serverNO, classID: device.classID, id: device.id, time: {$gte: startTime.AddDays(FIND_LAST_DAYS), $lt: startTime}}, {_id: 0, time: 0}, function (err, lastItem) {
                        if(err) logger.error(err);
                        var record = {_id: format_object_key(dayKey, device.serverNO, device.id), serverNO: device.serverNO, classID: device.classID, id: device.id, day: dayKey, time: startTime};

                        if(mPoints){
                            for(var key in mPoints){
                                var item = mPoints[key];
                                switch(item.type){
                                    case 3:
                                    case 2:
                                        if(item.value != undefined){
                                            record[key] = item.value;
                                        }
                                        break;
                                    case 1:
                                        if(lastItem && lastItem[key]){
                                            item.first = lastItem[key];
                                        }
                                        record[key] = format_value(item.last || 0);
                                        var _usage = format_value((item.last || 0) - (item.first || 0));
                                        if(_usage < 0){
                                            _usage = 0;
                                        }
                                        record[item.key] = _usage;
                                        break;
                                    default:
                                        if(item.value && item.count){
                                            record[key] = format_value(item.value / item.count);
                                        }
                                        break;
                                }
                            }
                        }

                        datadb.dmday.insert(record, function (err) {
                            if(err) logger.error({msg: 'insert day dm failed', err: err});
                            callback();
                        });
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    })
}

function static_device_data(callback) {
    var deviceList = ramdb.no.get_by_class_rang(uiclassID.device, uiclassID.lastDevice);
    try_each_series_day(deviceList, _static_device_data_day, function () {
        callback();
    });
}

function _static_device_data_mon(device, callback) {
    var _config = deviceHelper.get_device_type_config(device);
    if(!_config || !_config.mPoints){
        callback();
        return;
    }
    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        areaID: {type: 2}//区域ID
    };
    var mPoints = {};
    var _pointsConfig = _config.mPoints;
    for(var key in _pointsConfig){
        if(!config[key]){
            var item = _pointsConfig[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    var startTime = _nowTime.AddDays(-KEEP_DAYS).GetMonth();
    var monKey = format_mon_key(startTime);

    datadb.dmmon.exists_cache({serverNO: device.serverNO, classID: device.classID, id: device.id, month: monKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists){
            var endTime = _nowTime.GetMonth();

            var hasData = false;
            var query = {serverNO: device.serverNO, classID: device.classID, id: device.id, time: {$gte: startTime, $lt: endTime}};
            datadb.dmday.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, day: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }

                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static device data failed', err: err});
                }

                if(hasData){
                    var record = {_id: format_object_key(monKey, device.serverNO, device.id), serverNO: device.serverNO, classID: device.classID, id: device.id, month: monKey, time: startTime};
                    var lastItem = undefined;

                    if(mPoints){
                        for(var key in mPoints){
                            var item = mPoints[key];
                            switch(item.type){
                                case 3:
                                case 2:
                                    if(item.value != undefined){
                                        record[key] = item.value;
                                    }
                                    break;
                                case 1:
                                    if(lastItem && lastItem[key]){
                                        item.first = lastItem[key];
                                    }
                                    record[key] = format_value(item.last || 0);
                                    var _usage = format_value((item.last || 0) - (item.first || 0));
                                    if(_usage < 0){
                                        _usage = 0;
                                    }
                                    record[item.key] = _usage;
                                    break;
                                default:
                                    if(item.value && item.count){
                                        record[key] = format_value(item.value / item.count);
                                    }
                                    break;
                            }
                        }
                    }

                    datadb.dmmon.insert(record, function (err) {
                        if(err) logger.error({msg: 'insert day dm failed', err: err});
                        callback();
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    })
}

function static_device_data_mon(callback) {
    var deviceList = ramdb.no.get_by_class_rang(uiclassID.device, uiclassID.lastDevice);
    ah.each_series(deviceList, function (item, cbItem) {
        _static_device_data_mon(item, cbItem);
    }, function () {
        callback();
    });
}



function _static_room_data_day(room, startTime, callback) {
    var dayKey = format_day_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        maxCTemp: {type: 2},//最大值
        minCTemp: {type: 3},//最小值
        // hTemp: {type: 0},
        maxHTemp: {type: 2},//最大值
        minHTemp: {type: 3},//最小值
    };
    var mPoints = {};
    for(var key in room.points){
        if(!config[key]){
            var item = room.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.rmday.exists_cache({serverNO: room.serverNO, classID: room.classID, id: room.id, day: dayKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = startTime.AddDays(1);

            var hasData = false;
            var query = {serverNO: room.serverNO, classID: room.classID, id: room.id, time: {$gte: startTime, $lt: endTime}};
            datadb.rmdata.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item) {
                        var value = item[key];
                        if (value) {
                            var configItem = config[key];
                            var type = 0;
                            if (configItem) {
                                type = configItem.type;
                            }
                            switch (type) {
                                case 3:
                                    if (mPoints[key]) {
                                        if (value < mPoints[key].value) {
                                            mPoints[key].value = value;
                                        }
                                    } else {
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if (mPoints[key]) {
                                        if (value > mPoints[key].value) {
                                            mPoints[key].value = value;
                                        }
                                    } else {
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if (mPoints[key]) {
                                        mPoints[key].last = value;
                                    } else {
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if (mPoints[key]) {
                                        mPoints[key].count++;
                                        mPoints[key].value += value;
                                    } else {
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static room data failed', err: err});
                }

                if(hasData){
                    datadb.rmdata.find_last_cache({serverNO: room.serverNO, classID: room.classID, id: room.id, time: {$gte: startTime.AddDays(FIND_LAST_DAYS), $lt: startTime}}, {_id: 0, time: 0}, function (err, lastItem) {
                        if(err) logger.error(err);
                        var record = {_id: format_object_key(dayKey, room.serverNO, room.id), serverNO: room.serverNO, classID: room.classID, id: room.id, day: dayKey, time: startTime};

                        if(mPoints){
                            for(var key in mPoints){
                                var item = mPoints[key];
                                switch(item.type){
                                    case 3:
                                    case 2:
                                        if(item.value != undefined){
                                            record[key] = item.value;
                                        }
                                        break;
                                    case 1:
                                        if(lastItem && lastItem[key]){
                                            item.first = lastItem[key];
                                        }
                                        record[key] = format_value(item.last || 0);
                                        var _usage = format_value((item.last || 0) - (item.first || 0));
                                        if(_usage < 0){
                                            _usage = 0;
                                        }
                                        record[item.key] = _usage;
                                        break;
                                    default:
                                        if(item.value && item.count){
                                            record[key] = format_value(item.value / item.count);
                                        }
                                        break;
                                }
                            }
                        }

                        datadb.rmday.insert(record, function (err) {
                            if(err) logger.error({msg: 'insert day dm failed', err: err});
                            callback();
                        });
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_room_data(callback) {
    var roomList = areaHelper.get_data_room();
    try_each_series_day(roomList, _static_room_data_day, function () {
        callback();
    });
}

function _static_room_data_mon(room, callback) {
    var startTime = _nowTime.AddDays(-KEEP_DAYS).GetMonth();
    var monKey = format_mon_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        maxCTemp: {type: 2},//最大值
        minCTemp: {type: 3},//最小值
        // hTemp: {type: 0},
        maxHTemp: {type: 2},//最大值
        minHTemp: {type: 3}//最小值
    };
    var mPoints = {};
    for(var key in room.points){
        if(!config[key]) {
            var item = room.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.rmmon.exists_cache({serverNO: room.serverNO, classID: room.classID, id: room.id, month: monKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = _nowTime.GetMonth();

            var hasData = false;
            var query = {serverNO: room.serverNO, classID: room.classID, id: room.id, time: {$gte: startTime, $lt: endTime}};
            datadb.rmday.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, day: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static room data failed', err: err});
                }

                if(hasData){
                    var record = {_id: format_object_key(monKey, room.serverNO, room.id), serverNO: room.serverNO, classID: room.classID, id: room.id, month: monKey, time: startTime};
                    var lastItem = undefined;

                    if(mPoints){
                        for(var key in mPoints){
                            var item = mPoints[key];
                            switch(item.type){
                                case 3:
                                case 2:
                                    if(item.value != undefined){
                                        record[key] = item.value;
                                    }
                                    break;
                                case 1:
                                    if(lastItem && lastItem[key]){
                                        item.first = lastItem[key];
                                    }
                                    record[key] = format_value(item.last || 0);
                                    var _usage = format_value((item.last || 0) - (item.first || 0));
                                    if(_usage < 0){
                                        _usage = 0;
                                    }
                                    record[item.key] = _usage;
                                    break;
                                default:
                                    if(item.value && item.count){
                                        record[key] = format_value(item.value / item.count);
                                    }
                                    break;
                            }
                        }
                    }

                    datadb.rmmon.insert(record, function (err) {
                        if(err) logger.error({msg: 'insert day dm failed', err: err});
                        callback();
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_room_data_mon(callback) {
    var roomList = areaHelper.get_data_room();
    ah.each_series(roomList, function (item, cbItem) {
        _static_room_data_mon(item, cbItem);
    }, function () {
        callback();
    });
}


function _static_room_data_year(room, callback) {
    var startTime = _nowTime.AddDays(-KEEP_DAYS).GetYear();
    var yearKey = format_year_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        maxCTemp: {type: 2},//最大值
        minCTemp: {type: 3},//最小值
        // hTemp: {type: 0},
        maxHTemp: {type: 2},//最大值
        minHTemp: {type: 3}//最小值
    };
    var mPoints = {};
    for(var key in room.points){
        if(!config[key]) {
            var item = room.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.rmyear.exists_cache({serverNO: room.serverNO, classID: room.classID, id: room.id, year: yearKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = _nowTime.GetYear();

            var hasData = false;
            var query = {serverNO: room.serverNO, classID: room.classID, id: room.id, time: {$gte: startTime, $lt: endTime}};
            datadb.rmmon.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, month: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static room data failed', err: err});
                }

                if(hasData){
                    var record = {_id: format_object_key(yearKey, room.serverNO, room.id), serverNO: room.serverNO, classID: room.classID, id: room.id, year: yearKey, time: startTime};
                    var lastItem = undefined;

                    if(mPoints){
                        for(var key in mPoints){
                            var item = mPoints[key];
                            switch(item.type){
                                case 3:
                                case 2:
                                    if(item.value != undefined){
                                        record[key] = item.value;
                                    }
                                    break;
                                case 1:
                                    if(lastItem && lastItem[key]){
                                        item.first = lastItem[key];
                                    }
                                    record[key] = format_value(item.last || 0);
                                    var _usage = format_value((item.last || 0) - (item.first || 0));
                                    if(_usage < 0){
                                        _usage = 0;
                                    }
                                    record[item.key] = _usage;
                                    break;
                                default:
                                    if(item.value && item.count){
                                        record[key] = format_value(item.value / item.count);
                                    }
                                    break;
                            }
                        }
                    }

                    datadb.rmyear.insert(record, function (err) {
                        if(err) logger.error({msg: 'insert day dm failed', err: err});
                        callback();
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_room_data_year(callback) {
    var roomList = areaHelper.get_data_room();
    ah.each_series(roomList, function (item, cbItem) {
        _static_room_data_year(item, cbItem);
    }, function () {
        callback();
    });
}



function _static_area_data_day(area, startTime, callback){
    var dayKey = format_day_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        maxCTemp: {type: 2},//最大值
        minCTemp: {type: 3},//最小值
        // hTemp: {type: 0},
        maxHTemp: {type: 2},//最大值
        minHTemp: {type: 3},//最小值
        // oDryTemp: {type: 0},
        // oWetTemp: {type: 0},
        // oDewTemp: {type: 0},
        // cop: {type: 0}
    };
    var mPoints = {};
    for(var key in area.points){
        if(!config[key]) {
            var item = area.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.amday.exists_cache({serverNO: area.serverNO, classID: area.classID, id: area.id, day: dayKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = startTime.AddDays(1);

            var hasData = false;
            var query = {serverNO: area.serverNO, classID: area.classID, id: area.id, time: {$gte: startTime, $lt: endTime}};
            datadb.amdata.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static cop data failed', err: err});
                }

                if(hasData){
                    datadb.amdata.find_last_cache({serverNO: area.serverNO, classID: area.classID, id: area.id, time: {$gte: startTime.AddDays(FIND_LAST_DAYS), $lt: startTime}}, {_id: 0, time: 0}, function (err, lastItem) {
                        if(err) logger.error(err);
                        var record = {_id: format_object_key(dayKey, area.serverNO, area.id), serverNO: area.serverNO, classID: area.classID, id: area.id, day: dayKey, time: startTime};

                        if(mPoints){
                            for(var key in mPoints){
                                var item = mPoints[key];
                                switch(item.type){
                                    case 3:
                                    case 2:
                                        if(item.value != undefined){
                                            record[key] = item.value;
                                        }
                                        break;
                                    case 1:
                                        if(lastItem && lastItem[key]){
                                            item.first = lastItem[key];
                                        }
                                        record[key] = format_value(item.last || 0);
                                        var _usage = format_value((item.last || 0) - (item.first || 0));
                                        if(_usage < 0){
                                            _usage = 0;
                                        }
                                        record[item.key] = _usage;
                                        break;
                                    default:
                                        if(item.value && item.count){
                                            record[key] = format_value(item.value / item.count);
                                        }
                                        break;
                                }
                            }
                        }

                        datadb.amday.insert(record, function (err) {
                            if(err) logger.error({msg: 'insert day am failed', err: err});
                            callback();
                        });
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_area_data(callback){
    var areaList = ramdb.no.get_by_class(uiclassID.area);
    try_each_series_day(areaList, _static_area_data_day, function () {
        callback();
    });
}

function _static_area_data_mon(area, callback){
    var startTime = _nowTime.AddDays(-KEEP_DAYS).GetMonth();
    var monKey = format_mon_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        maxCTemp: {type: 2},//最大值
        minCTemp: {type: 3},//最小值
        // hTemp: {type: 0},
        maxHTemp: {type: 2},//最大值
        minHTemp: {type: 3},//最小值
        // oDryTemp: {type: 0},
        // oWetTemp: {type: 0},
        // oDewTemp: {type: 0},
        // cop: {type: 0}
    };
    var mPoints = {};
    for(var key in area.points){
        if(!config[key]) {
            var item = area.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.ammon.exists_cache({serverNO: area.serverNO, classID: area.classID, id: area.id, month: monKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = _nowTime.GetMonth();

            var hasData = false;
            var query = {serverNO: area.serverNO, classID: area.classID, id: area.id, time: {$gte: startTime, $lt: endTime}};
            datadb.amday.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, day: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static cop data failed', err: err});
                }

                if(hasData){
                    var record = {_id: format_object_key(monKey, area.serverNO, area.id), serverNO: area.serverNO, classID: area.classID, id: area.id, month: monKey, time: startTime};
                    var lastItem = undefined;

                    if(mPoints){
                        for(var key in mPoints){
                            var item = mPoints[key];
                            switch(item.type){
                                case 3:
                                case 2:
                                    if(item.value != undefined){
                                        record[key] = item.value;
                                    }
                                    break;
                                case 1:
                                    if(lastItem && lastItem[key]){
                                        item.first = lastItem[key];
                                    }
                                    record[key] = format_value(item.last || 0);
                                    var _usage = format_value((item.last || 0) - (item.first || 0));
                                    if(_usage < 0){
                                        _usage = 0;
                                    }
                                    record[item.key] = _usage;
                                    break;
                                default:
                                    if(item.value && item.count){
                                        record[key] = format_value(item.value / item.count);
                                    }
                                    break;
                            }
                        }
                    }

                    datadb.ammon.insert(record, function (err) {
                        if(err) logger.error({msg: 'insert day am failed', err: err});
                        callback();
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_area_data_mon(callback){
    var areaList = ramdb.no.get_by_class(uiclassID.area);
    ah.each_series(areaList, function (item, cbItem) {
        _static_area_data_mon(item, cbItem);
    }, function () {
        callback();
    });
}

function _static_area_data_year(area, callback){
    var startTime = _nowTime.AddDays(-KEEP_DAYS).GetYear();
    var yearKey = format_year_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        maxCTemp: {type: 2},//最大值
        minCTemp: {type: 3},//最小值
        // hTemp: {type: 0},
        maxHTemp: {type: 2},//最大值
        minHTemp: {type: 3},//最小值
        // oDryTemp: {type: 0},
        // oWetTemp: {type: 0},
        // oDewTemp: {type: 0},
        // cop: {type: 0}
    };
    var mPoints = {};
    for(var key in area.points){
        if(!config[key]) {
            var item = area.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.amyear.exists_cache({serverNO: area.serverNO, classID: area.classID, id: area.id, year: yearKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = _nowTime.GetYear();

            var hasData = false;
            var query = {serverNO: area.serverNO, classID: area.classID, id: area.id, time: {$gte: startTime, $lt: endTime}};
            datadb.ammon.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, month: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static cop data failed', err: err});
                }

                if(hasData){
                    var record = {_id: format_object_key(yearKey, area.serverNO, area.id), serverNO: area.serverNO, classID: area.classID, id: area.id, year: yearKey, time: startTime};
                    var lastItem = undefined;

                    if(mPoints){
                        for(var key in mPoints){
                            var item = mPoints[key];
                            switch(item.type){
                                case 3:
                                case 2:
                                    if(item.value != undefined){
                                        record[key] = item.value;
                                    }
                                    break;
                                case 1:
                                    if(lastItem && lastItem[key]){
                                        item.first = lastItem[key];
                                    }
                                    record[key] = format_value(item.last || 0);
                                    var _usage = format_value((item.last || 0) - (item.first || 0));
                                    if(_usage < 0){
                                        _usage = 0;
                                    }
                                    record[item.key] = _usage;
                                    break;
                                default:
                                    if(item.value && item.count){
                                        record[key] = format_value(item.value / item.count);
                                    }
                                    break;
                            }
                        }
                    }

                    datadb.amyear.insert(record, function (err) {
                        if(err) logger.error({msg: 'insert year am failed', err: err});
                        callback();
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_area_data_year(callback){
    var areaList = ramdb.no.get_by_class(uiclassID.area);
    ah.each_series(areaList, function (item, cbItem) {
        _static_area_data_year(item, cbItem);
    }, function () {
        callback();
    });
}



function _static_building_data_day(building, startTime, callback){
    var dayKey = format_day_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        maxCTemp: {type: 2},//最大值
        minCTemp: {type: 3},//最小值
        // hTemp: {type: 0},
        maxHTemp: {type: 2},//最大值
        minHTemp: {type: 3},//最小值
        // oDryTemp: {type: 0},
        // oWetTemp: {type: 0},
        // oDewTemp: {type: 0},
        // cop: {type: 0}
    };
    var mPoints = {};
    for(var key in building.points){
        if(!config[key]) {
            var item = building.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.amday.exists_cache({serverNO: building.serverNO, classID: building.classID, id: building.id, day: dayKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = startTime.AddDays(1);

            var hasData = false;
            var query = {serverNO: building.serverNO, classID: building.classID, id: building.id, time: {$gte: startTime, $lt: endTime}};
            datadb.amdata.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static cop data failed', err: err});
                }

                if(hasData){
                    datadb.amdata.find_last_cache({serverNO: building.serverNO, classID: building.classID, id: building.id, time: {$gte: startTime.AddDays(FIND_LAST_DAYS), $lt: startTime}}, {_id: 0, time: 0}, function (err, lastItem) {
                        if(err) logger.error(err);
                        var record = {_id: format_object_key(dayKey, building.serverNO, building.id), serverNO: building.serverNO, classID: building.classID, id: building.id, day: dayKey, time: startTime};

                        if(mPoints){
                            for(var key in mPoints){
                                var item = mPoints[key];
                                switch(item.type){
                                    case 3:
                                    case 2:
                                        if(item.value != undefined){
                                            record[key] = item.value;
                                        }
                                        break;
                                    case 1:
                                        if(lastItem && lastItem[key]){
                                            item.first = lastItem[key];
                                        }
                                        record[key] = format_value(item.last || 0);
                                        var _usage = format_value((item.last || 0) - (item.first || 0));
                                        if(_usage < 0){
                                            _usage = 0;
                                        }
                                        record[item.key] = _usage;
                                        break;
                                    default:
                                        if(item.value && item.count){
                                            record[key] = format_value(item.value / item.count);
                                        }
                                        break;
                                }
                            }
                        }

                        datadb.amday.insert(record, function (err) {
                            if(err) logger.error({msg: 'insert day dm failed', err: err});
                            callback();
                        });
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_building_data(callback){
    var buildingList = ramdb.no.get_by_class(uiclassID.building);
    try_each_series_day(buildingList, _static_building_data_day, function () {
        callback();
    });
}

function _static_building_data_mon(building, callback){
    var startTime = _nowTime.AddDays(-KEEP_DAYS).GetMonth();
    var monKey = format_mon_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        maxCTemp: {type: 2},//最大值
        minCTemp: {type: 3},//最小值
        // hTemp: {type: 0},
        maxHTemp: {type: 2},//最大值
        minHTemp: {type: 3},//最小值
        // oDryTemp: {type: 0},
        // oWetTemp: {type: 0},
        // oDewTemp: {type: 0},
        // cop: {type: 0}
    };
    var mPoints = {};
    for(var key in building.points){
        if(!config[key]) {
            var item = building.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.ammon.exists_cache({serverNO: building.serverNO, classID: building.classID, id: building.id, month: monKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = _nowTime.GetMonth();

            var hasData = false;
            var query = {serverNO: building.serverNO, classID: building.classID, id: building.id, time: {$gte: startTime, $lt: endTime}};
            datadb.amday.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, day: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static cop data failed', err: err});
                }

                if(hasData){
                    var record = {_id: format_object_key(monKey, building.serverNO, building.id), serverNO: building.serverNO, classID: building.classID, id: building.id, month: monKey, time: startTime};
                    var lastItem = undefined;

                    if(mPoints){
                        for(var key in mPoints){
                            var item = mPoints[key];
                            switch(item.type){
                                case 3:
                                case 2:
                                    if(item.value != undefined){
                                        record[key] = item.value;
                                    }
                                    break;
                                case 1:
                                    if(lastItem && lastItem[key]){
                                        item.first = lastItem[key];
                                    }
                                    record[key] = format_value(item.last || 0);
                                    var _usage = format_value((item.last || 0) - (item.first || 0));
                                    if(_usage < 0){
                                        _usage = 0;
                                    }
                                    record[item.key] = _usage;
                                    break;
                                default:
                                    if(item.value && item.count){
                                        record[key] = format_value(item.value / item.count);
                                    }
                                    break;
                            }
                        }
                    }

                    datadb.ammon.insert(record, function (err) {
                        if(err) logger.error({msg: 'insert day dm failed', err: err});
                        callback();
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_building_data_mon(callback){
    var buildingList = ramdb.no.get_by_class(uiclassID.building);
    ah.each_series(buildingList, function (item, cbItem) {
        _static_building_data_mon(item, cbItem);
    }, function () {
        callback();
    });
}

function _static_building_data_year(building, callback){
    var startTime = _nowTime.AddDays(-KEEP_DAYS).GetYear();
    var yearKey = format_year_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
        maxCTemp: {type: 2},//最大值
        minCTemp: {type: 3},//最小值
        // hTemp: {type: 0},
        maxHTemp: {type: 2},//最大值
        minHTemp: {type: 3},//最小值
        // oDryTemp: {type: 0},
        // oWetTemp: {type: 0},
        // oDewTemp: {type: 0},
        // cop: {type: 0}
    };
    var mPoints = {};
    for(var key in building.points){
        if(!config[key]) {
            var item = building.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.amyear.exists_cache({serverNO: building.serverNO, classID: building.classID, id: building.id, year: yearKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = _nowTime.GetYear();

            var hasData = false;
            var query = {serverNO: building.serverNO, classID: building.classID, id: building.id, time: {$gte: startTime, $lt: endTime}};
            datadb.ammon.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, month: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static cop data failed', err: err});
                }

                if(hasData){
                    var record = {_id: format_object_key(yearKey, building.serverNO, building.id), serverNO: building.serverNO, classID: building.classID, id: building.id, year: yearKey, time: startTime};
                    var lastItem = undefined;

                    if(mPoints){
                        for(var key in mPoints){
                            var item = mPoints[key];
                            switch(item.type){
                                case 3:
                                case 2:
                                    if(item.value != undefined){
                                        record[key] = item.value;
                                    }
                                    break;
                                case 1:
                                    if(lastItem && lastItem[key]){
                                        item.first = lastItem[key];
                                    }
                                    record[key] = format_value(item.last || 0);
                                    var _usage = format_value((item.last || 0) - (item.first || 0));
                                    if(_usage < 0){
                                        _usage = 0;
                                    }
                                    record[item.key] = _usage;
                                    break;
                                default:
                                    if(item.value && item.count){
                                        record[key] = format_value(item.value / item.count);
                                    }
                                    break;
                            }
                        }
                    }

                    datadb.amyear.insert(record, function (err) {
                        if(err) logger.error({msg: 'insert day dm failed', err: err});
                        callback();
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_building_data_year(callback){
    var buildingList = ramdb.no.get_by_class(uiclassID.building);
    ah.each_series(buildingList, function (item, cbItem) {
        _static_building_data_year(item, cbItem);
    }, function () {
        callback();
    });
}




function _static_park_data_day(park, startTime, callback){
    var dayKey = format_day_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
    };
    var mPoints = {};
    for(var key in park.points){
        if(!config[key]) {
            var item = park.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.amday.exists_cache({serverNO: park.serverNO, classID: park.classID, id: park.id, day: dayKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = startTime.AddDays(1);

            var hasData = false;
            var query = {serverNO: park.serverNO, classID: park.classID, id: park.id, time: {$gte: startTime, $lt: endTime}};
            datadb.amdata.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static cop data failed', err: err});
                }

                if(hasData){
                    datadb.amdata.find_last_cache({serverNO: park.serverNO, classID: park.classID, id: park.id, time: {$gte: startTime.AddDays(FIND_LAST_DAYS), $lt: startTime}}, {_id: 0, time: 0}, function (err, lastItem) {
                        if(err) logger.error(err);
                        var record = {_id: format_object_key(dayKey, park.serverNO, park.id), serverNO: park.serverNO, classID: park.classID, id: park.id, day: dayKey, time: startTime};

                        if(mPoints){
                            for(var key in mPoints){
                                var item = mPoints[key];
                                switch(item.type){
                                    case 3:
                                    case 2:
                                        if(item.value != undefined){
                                            record[key] = item.value;
                                        }
                                        break;
                                    case 1:
                                        if(lastItem && lastItem[key]){
                                            item.first = lastItem[key];
                                        }
                                        record[key] = format_value(item.last || 0);
                                        var _usage = format_value((item.last || 0) - (item.first || 0));
                                        if(_usage < 0){
                                            _usage = 0;
                                        }
                                        record[item.key] = _usage;
                                        break;
                                    default:
                                        if(item.value && item.count){
                                            record[key] = format_value(item.value / item.count);
                                        }
                                        break;
                                }
                            }
                        }

                        datadb.amday.insert(record, function (err) {
                            if(err) logger.error({msg: 'insert day dm failed', err: err});
                            callback();
                        });
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_park_data(callback){
    var parkList = ramdb.no.get_by_class(uiclassID.park);
    try_each_series_day(parkList, _static_park_data_day, function () {
        callback();
    });
}

function _static_park_data_mon(park, callback){
    var startTime = _nowTime.AddDays(-KEEP_DAYS).GetMonth();
    var monKey = format_mon_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
    };
    var mPoints = {};
    for(var key in park.points){
        if(!config[key]) {
            var item = park.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.ammon.exists_cache({serverNO: park.serverNO, classID: park.classID, id: park.id, month: monKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = _nowTime.GetMonth();

            var hasData = false;
            var query = {serverNO: park.serverNO, classID: park.classID, id: park.id, time: {$gte: startTime, $lt: endTime}};
            datadb.amday.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, day: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static park data failed', err: err});
                }

                if(hasData){
                    var record = {_id: format_object_key(monKey, park.serverNO, park.id), serverNO: park.serverNO, classID: park.classID, id: park.id, month: monKey, time: startTime};
                    var lastItem = undefined;

                    if(mPoints){
                        for(var key in mPoints){
                            var item = mPoints[key];
                            switch(item.type){
                                case 3:
                                case 2:
                                    if(item.value != undefined){
                                        record[key] = item.value;
                                    }
                                    break;
                                case 1:
                                    if(lastItem && lastItem[key]){
                                        item.first = lastItem[key];
                                    }
                                    record[key] = format_value(item.last || 0);
                                    var _usage = format_value((item.last || 0) - (item.first || 0));
                                    if(_usage < 0){
                                        _usage = 0;
                                    }
                                    record[item.key] = _usage;
                                    break;
                                default:
                                    if(item.value && item.count){
                                        record[key] = format_value(item.value / item.count);
                                    }
                                    break;
                            }
                        }
                    }

                    datadb.ammon.insert(record, function (err) {
                        if(err) logger.error({msg: 'insert day dm failed', err: err});
                        callback();
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_park_data_mon(callback){
    var parkList = ramdb.no.get_by_class(uiclassID.park);
    ah.each_series(parkList, function (item, cbItem) {
        _static_park_data_mon(item, cbItem);
    }, function () {
        callback();
    });
}

function _static_park_data_year(park, callback){
    var startTime = _nowTime.AddDays(-KEEP_DAYS).GetYear();
    var yearKey = format_year_key(startTime);

    var config = {
        power: {type: 0},
        energy: {type: 1, key: 'enUsage'},
        water: {type: 1, key: 'waterUsage'},
    };
    var mPoints = {};
    for(var key in park.points){
        if(!config[key]) {
            var item = park.points[key];
            config[key] = {type: item.type || 0, key: item.key};
        }
    }

    datadb.amyear.exists_cache({serverNO: park.serverNO, classID: park.classID, id: park.id, year: yearKey}, function (err, exists) {
        if(err) return callback(err);
        if(!exists) {
            var endTime = _nowTime.GetYear();

            var hasData = false;
            var query = {serverNO: park.serverNO, classID: park.classID, id: park.id, time: {$gte: startTime, $lt: endTime}};
            datadb.ammon.find_cache(query, {_id: 0, serverNO: 0, classID: 0, id: 0, month: 0, original: 0, time: 0}, function (data) {
                for(var i=0;i<data.length;i++){
                    var item = data[i];

                    for(var key in item){
                        var value = item[key];
                        if(value){
                            var configItem = config[key];
                            var type = 0;
                            if(configItem){
                                type = configItem.type;
                            }
                            switch(type){
                                case 3:
                                    if(mPoints[key]){
                                        if(value < mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 2:
                                    if(mPoints[key]){
                                        if(value > mPoints[key].value){
                                            mPoints[key].value = value;
                                        }
                                    }else{
                                        mPoints[key] = {type: type, value: value};
                                    }
                                    break;
                                case 1:
                                    if(mPoints[key]){
                                        mPoints[key].last=value;
                                    }else{
                                        mPoints[key] = {type: type, key: configItem.key, first: value, last: value};
                                    }
                                    break;
                                default:
                                    if(mPoints[key]){
                                        mPoints[key].count++;
                                        mPoints[key].value+=value;
                                    }else{
                                        mPoints[key] = {type: type, count: 1, value: value};
                                    }
                                    break;
                            }
                        }
                    }
                }
                hasData = true;
            }, function (err) {
                if(err){
                    logger.error({msg: 'static park data failed', err: err});
                }

                if(hasData){
                    var record = {_id: format_object_key(yearKey, park.serverNO, park.id), serverNO: park.serverNO, classID: park.classID, id: park.id, year: yearKey, time: startTime};
                    var lastItem = undefined;

                    if(mPoints){
                        for(var key in mPoints){
                            var item = mPoints[key];
                            switch(item.type){
                                case 3:
                                case 2:
                                    if(item.value != undefined){
                                        record[key] = item.value;
                                    }
                                    break;
                                case 1:
                                    if(lastItem && lastItem[key]){
                                        item.first = lastItem[key];
                                    }
                                    record[key] = format_value(item.last || 0);
                                    var _usage = format_value((item.last || 0) - (item.first || 0));
                                    if(_usage < 0){
                                        _usage = 0;
                                    }
                                    record[item.key] = _usage;
                                    break;
                                default:
                                    if(item.value && item.count){
                                        record[key] = format_value(item.value / item.count);
                                    }
                                    break;
                            }
                        }
                    }

                    datadb.amyear.insert(record, function (err) {
                        if(err) logger.error({msg: 'insert year dm failed', err: err});
                        callback();
                    });
                }else{
                    callback();
                }
            });
        }else{
            callback();
        }
    });
}

function static_park_data_year(callback){
    var parkList = ramdb.no.get_by_class(uiclassID.park);
    ah.each_series(parkList, function (item, cbItem) {
        _static_park_data_year(item, cbItem);
    }, function () {
        callback();
    });
}


function start_static_data() {
    //添加缓存-初始化
    let cache_info = ramdb.cfg.get_system_config('his_data_cache_info');
    if(cache_info == undefined){
        cache_info = {time: new Date()};
        db.cfg.update_system_config(svrType, 'his_data_cache_info', cache_info, function (err) {
            if(err) logger.error({msg: 'init cache info failed', err: err});
            ramdb.cfg.get_system_config('his_data_cache_info');
        })
    }
    global.start_cache_time = cache_info.time.getTime();

    function static_data() {
        //统计前一天数据
        _nowTime = new Date().GetDate();

        var arr = [static_device_data, static_room_data, static_area_data, static_building_data, static_park_data];

        var month = _nowTime.getMonth() + 1;
        var day = _nowTime.getDate();

        if(day <= KEEP_DAYS){
            arr.push(static_device_data_mon, static_room_data_mon, static_area_data_mon, static_building_data_mon, static_park_data_mon);
            if(month == 1){
                arr.push(static_room_data_year, static_area_data_year, static_building_data_year, static_park_data_year);
            }
        }

        ah.series(arr, function () {
            logger.info('cal his data finished');
        });

        setTimeout(function () {//10分钟后调度下一次
            schedule_next();
        }, 0.5 * 60 * 1000);
    }

    function schedule_next() {
        var now = Date.now();
        var time = new Date(now);
        var hour = time.getHours();
        var min = time.getMinutes();
        var sec = time.getSeconds();

        if(hour == 0 && min == 0 && sec == 0){
            static_data();
        }else{
            var today_schedule = new Date(now);
            today_schedule.setHours(0);
            today_schedule.setMinutes(0);
            today_schedule.setSeconds(0);
            today_schedule.setMilliseconds(0);

            var next;
            if(today_schedule > time){
                next = today_schedule;
            }else{
                next = today_schedule.AddDays(1);
            }

            var interval = next.getTime() - now + 60 * 1000;
            setTimeout(function () {
                static_data();
            }, interval);
            logger.info('now: %j, his data cal schedule next: ', new Date(), interval / 1000);
        }
    }

    //TODO: 开始统计数据前，判断楼栋状态
    setTimeout(function () {
        static_data();
    // }, 3 * 1000);
    }, 60 * 1000);
}

module.exports.start_static_data = start_static_data;