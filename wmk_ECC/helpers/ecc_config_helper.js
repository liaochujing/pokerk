/**
 * Created by wangxh on 2017/12/4.
 */

'use strict';

var fs = require('fs');
var util = require('util');
var path = require('path');
var ah = require('../util/array_helper');
var st = require('../util/small_tools');
var pathHelper = require('../util/path_helper');
var logger = require('../util/log_manager').logger;
var uiclassID = require('../definition/uiClassID');

var objectHelper = require('../objects/object_helper');

var db = require('../db');
var ramdb = db.ramdb;


function updateDeviceTypeConfig(configs, callback) {
    var dbDEP = db.dep;
    dbDEP.clear_device_type(function (err) {
        if(err) return callback(err);
        var now = new Date();
        ah.each_series(configs, function (item, cbItem) {
            var time = now;
            if(item.time){
                time = new Date(item.time);
            }
            dbDEP.insert_device_type(item.system, item.systemName, item.group, item.groupName, item.id, item.name, item.desc, item.pointList, item.config, time, function (err) {
                cbItem(err);
            })
        }, function (err) {
            //重置缓存模板信息
            db.ramdb.dep.reset(configs);
            callback(err);
        })
    });
}

function updateCollectDeviceTypeConfig(configs, callback) {
    var dbCDT = db.cdt;
    dbCDT.clear_collect_device_type(function (err) {
        if(err) return callback(err);
        var now = new Date();
        ah.each_series(configs, function (item, cbItem) {
            var time = now;
            if(item.time){
                time = new Date(item.time);
            }
            dbCDT.insert_collect_device_type(item.id, item.name, item.desc, item.pointList, item.data, item.config, time, function (err) {
                cbItem(err);
            })
        }, function (err) {
            //重置缓存模板信息
            db.ramdb.cdt.reset(configs);

            callback(err);
        })
    });
}

function updateAlarmTypeConfig(configs, callback) {
    var dbALP = db.alp;
    dbALP.clear_alarm_type(function (err) {
        if(err) return callback(err);
        var now = new Date();
        ah.each_series(configs, function (item, cbNextItem) {
            var time = now;
            if(item.time){
                time = new Date(item.time);
            }
            dbALP.insert_alarm_type(item.id, item.name, item.condition, item.option, item.config, time, function (err) {
                cbNextItem(err);
            })
        }, function (err) {
            callback(err);
        })
    });
}

function updateAssetTypeConfig(configs, callback) {
    var assetType = db.ast;
    assetType.clear_asset_type(function (err) {
        if(err) return callback(err);
        ah.each_series(configs, function (item, cbNextItem) {
            assetType.insert_asset_type(item.system, item.name, item.groups, item.desc, function (err) {
                cbNextItem(err);
            })
        }, function (err) {
            callback(err);
        })
    });
}

function updatePrivilegeConfig(configs, callback) {
    var privilege = db.privilege;
    privilege.clear_privilege(function (err) {
        if(err) return callback(err);
        ah.each_series(configs, function (item, cbItem) {
            privilege.insert_privilege(item.id, item.name, item.desc, item.points, function (err) {
                cbItem(err);
            })
        }, function (err) {
            callback(err);
        })
    });
}

function updateOperatorConfig(configs, callback) {
    var dbObjID = db.objID;
    var dbOO = db.oo;
    var dbOOR = db.oor;

    var maxID = 0;
    var add_nameobject = function (item, done) {
        var container = item.container;
        var object = item.object;
        if(maxID < object.id){
            maxID = object.id;
        }
        var _no = objectHelper.createNameObject(object.classID);
        if(!_no){
            return done(new Error('unknown classID: '+ object.classID));
        }
        _no.load_from_json(object);

        dbOOR.insert_relation(container.serverNO, container.classID, container.id, object.serverNO, object.classID, object.id, function (err) {
            if(err) return done(err);
            _no.insert_db(function (err) {
                done(err)
            })
        });
    };

    ah.series([function (cb) {
        dbOO.clear_operator_object({}, cb);
    }, function (cb) {
        dbOOR.clear_opr_relation({}, cb);
    }], function (err) {
        if(err){
            callback(err);
            return;
        }
        ah.each_series(configs, function (item, next_action) {
            add_nameobject(item, function (err) {
                if(err){
                    logger.error(err);
                }
                next_action(err);
            })
        }, function (err) {
            if(err){
                callback(err);
                return;
            }
            dbObjID.update_object_id('operator_object', maxID, function (err) {
                callback(err);
            });
        });
    });
}


function updateSystemConfig(configs, callback) {
    var cfg = db.cfg;
    cfg.clear_system_config(function (err) {
        if(err) return callback(err);
        ah.each_series(configs, function (config, cbItem) {
            cfg.update_system_config(config.system, config.key, config.value, function (err) {
                cbItem(err);
            })
        }, function (err) {
            callback(err);
        })
    });
}

function updateInstanceConfig(configs, callback, isExt) {
    var dbObjID = db.objID;
    var dbNO = db.no;
    var dbNOR = db.nor;
    var dbDP = db.dp;

    var maxID = 0;
    var insert_relation = function (object, container, done) {
        dbNOR.insert_relation(container.serverNO, container.classID, container.id, object.serverNO, object.classID, object.id, function (err) {
            if(err) return done(err);
            done();
        });
    };
    var add_nameobject = function (item, done) {
        var container = item.container;
        var object = item.object;
        if(maxID < object.id){
            maxID = object.id;
        }

        var _no = objectHelper.createNameObject(object.classID);
        if(!_no){
            return done(new Error('unknown classID: '+ object.classID));
        }
        _no.load_from_json(object);
        insert_relation(_no, container, function (err) {
            if(err) return done(err);
            _no.insert_db(function (err) {
                if(err) return done(err);
                if(object.classID >= uiclassID.device && object.classID <= uiclassID.lastDevice){
                    _no.gen_point_list(null, done);
                }else{
                    done(err)
                }
            })
        })
    };

    var actions = [];
    if(!isExt){
        actions = [function (cb) {
            dbNO.clear_nameobject({}, cb);
        }, function (cb) {
            dbNOR.clear_no_relation({}, cb);
        }, function (cb) {
            dbDP.clear_devicepoint({}, cb);
        }]
    }

    ah.series(actions, function (err) {
        if(err){
            callback(err);
            return;
        }
        ah.each_series(configs, function (item, next_action) {
            add_nameobject(item, function (err) {
                if(err){
                    logger.error(err);
                }
                next_action(err);
            })
        }, function (err) {
            if(err){
                callback(err);
                return;
            }
            dbObjID.update_object_id('nameobject', maxID, function (err) {
                callback(err);
            })
        });
    });
}

function updatePointConfig(configs, callback) {
    var dbDP = db.dp;
    ah.each_series(configs, function (item, cbNextItem) {
        dbDP.update_devicepoint_data(item.serverNO, item.classID, item.id, item.points, function (err) {
            if(err) return cbNextItem(err);
            cbNextItem();
        });
    }, function (err) {
        callback(err);
    });
}

function updatePointBindingConfig(configs, callback) {
    var dbDP = db.dp;
    ah.each_series(configs, function (item, cbNextItem) {
        dbDP.update_devicepoint_binding_list(item.serverNO, item.classID, item.id, item.points, function (err) {
            if(err) return cbNextItem(err);
            cbNextItem();
        });
    }, function (err) {
        callback(err);
    });
}

function import_ecc_ext_config(config, callback) {
    var action = [];

    if(config.instance){
        action.push(function (cb) {
            updateInstanceConfig(config.instance, cb, true);
        })
    }

    ah.series(action, function (err) {
        if(err){
            callback(err);
            return;
        }

        callback();
    })
}

function import_ecc_config(config, callback) {
    var action = [];

    if(config.systemConfig){
        action.push(function (cb) {
            updateSystemConfig(config.systemConfig, cb);
        })
    }
    if(config.instance){
        action.push(function (cb) {
            updateInstanceConfig(config.instance, cb);
        })
    }
    if(config.operatorConfig){
        action.push(function (cb) {
            updateOperatorConfig(config.operatorConfig, cb);
        })
    }

    ah.series(action, function (err) {
        if(err){
            callback(err);
            return;
        }

        callback();
    })
}

function export_ecc_config(callback) {
    var config = {};

    var systemConfig = [];
    var privilegeList = [];
    var instance = [];
    var objectIDConfig = [];

    config.systemConfig = systemConfig;
    config.instance = instance;
    config.objectIDConfig = objectIDConfig;

    var dbCFG = db.cfg;
    var rdbNO = ramdb.no;
    var rdbNOR = ramdb.nor;
    var dbDP = db.dp;
    var rdbCNO = ramdb.cno;
    var rdbCNOR = ramdb.cnor;
    var dbObjID = db.objID;

    var export_system_config = function (done) {
        dbCFG.find_system_config({}, {_id: 0}, function (err, results) {
            if(err) return done(err);

            if(results){
                for(var i in results){
                    var item = results[i];

                    systemConfig.push({
                        system: item.system,
                        key: item.key,
                        value: item.value
                    })
                }
            }

            done();
        })
    };

    var export_instance = function (done) {
        var parks = rdbNO.get_by_class(uiclassID.park);
        for(var i in parks){
            var park = parks[i];
            instance.push({container: {serverNO: 0, classID: 0, id: 0}, object: {serverNO: park.serverNO, classID: park.classID, id: park.id, fullName: park.fullName, description: park.description, restData: park.gen_rest_data(), createTime: park.createTime, modifyTime: park.modifyTime}});
        }
        done();
    };

    var export_object_id = function (done) {
        dbObjID.find_object_id({}, {}, function (err, data) {
            if(err) return done(err);
            if(data){
                for(var i in data){
                    var item = data[i];
                    objectIDConfig.push({key: item._id, id: item.id});
                }
            }

            done();
        })
    };

    ah.series([export_system_config, export_instance, export_object_id], function (err) {
        if(err) return callback(err);

        callback(null, config);
    })
}


function updateServiceInstanceConfig(serviceInfo, instances, callback, isExt) {
    var rdbNO = ramdb.no;
    var rdbNOR = ramdb.nor;

    var dbObjID = db.objID;
    var dbNO = db.no;
    var dbNOR = db.nor;
    var dbDP = db.dp;

    var serverNO = serviceInfo.serverNO;

    var _parkList = rdbNO.get_by_class(uiclassID.park);
    var park = undefined;
    if(_parkList && _parkList.length > 0){
        park = _parkList[0];
    }else{
        callback(new Error('root park object not found'));
        return;
    }

    var maxID = 0;
    var add_nameobject = function (item, done) {
        var container = item.container;
        var object = item.object;
        if(maxID < object.id){
            maxID = object.id;
        }
        if(object.classID == uiclassID.park){//跳过园区对象
            done();
            return;
        }
        if(object.classID == uiclassID.building){//楼栋对象直接配置到园区对象下
            container = {serverNO: park.serverNO, classID: park.classID, id: park.id};
        }

        var _no = objectHelper.createNameObject(object.classID);
        if(!_no){
            return done(new Error('unknown classID: '+ object.classID));
        }

        _no.load_from_json(object);
        dbNOR.insert_relation(container.serverNO, container.classID, container.id, object.serverNO, object.classID, object.id, function (err) {
            if(err) return done(err);
            _no.insert_db(function (err) {
                done(err)
            })
        });
    };

    var actions = [];
    if(!isExt){
        actions = [function (cb) {
            dbNO.clear_nameobject({serverNO: serverNO}, cb);
        }, function (cb) {
            dbNOR.clear_no_relation({$or: [{serverNO: serverNO}, {childServerNO: serverNO}]}, cb);
        }, function (cb) {
            dbDP.clear_devicepoint({serverNO: serverNO}, cb);
        }]
    }

    ah.series(actions, function (err) {
        if(err){
            callback(err);
            return;
        }
        ah.each_series(instances, function (item, next_action) {
            add_nameobject(item, function (err) {
                if(err){
                    logger.error(err);
                }
                next_action(err);
            })
        }, function (err) {
            if(err){
                callback(err);
                return;
            }
            dbObjID.ensure_object_id('nameobject', maxID, function (err) {
                callback(err);
            })
        });
    });
}

function updateServiceCollectInstanceConfig(serviceInfo, collectInstance, callback, isExt) {
    var dbObjID = db.objID;
    var dbCNO = db.cno;
    var dbCNOR = db.cnor;

    var serverNO = serviceInfo.serverNO;
    var maxID = 0;
    var add_device = function (item, done) {
        var container = item.container;
        var object = item.object;
        if(maxID < object.id){
            maxID = object.id;
        }
        var _no = objectHelper.createNameObject(object.classID);
        if(!_no){
            return done(new Error('unknown classID: '+ object.classID));
        }
        _no.load_from_json(object);
        dbCNOR.insert_relation(container.serverNO, container.classID, container.id, object.serverNO, object.classID, object.id, function (err) {
            if(err) return done(err);
            _no.insert_db(function (err) {
                done(err)
            })
        });
    };

    var actions = [];
    if(!isExt){
        actions = [function (cb) {
            dbCNO.clear_collect_object({serverNO: serverNO}, cb);
        }, function (cb) {
            dbCNOR.clear_cno_relation({$or: [{serverNO: serverNO}, {childServerNO: serverNO}]}, cb);
        }]
    }

    ah.series(actions, function (err) {
        if(err){
            callback(err);
            return;
        }
        ah.each_series(collectInstance, function (item, next_action) {
            add_device(item, function (err) {
                next_action(err);
            })
        }, function (err) {
            if(err){
                callback(err);
                return;
            }
            dbObjID.ensure_object_id('collect_object', maxID, function (err) {
                callback(err);
            })
        });
    });
}


function import_service_ext_config(config, callback) {
    var serviceInfo = config.serviceInfo;
    var action = [];

    if(config.instance){
        action.push(function (cb) {
            updateServiceInstanceConfig(serviceInfo, config.instance, cb, true);
        })
    }
    if(config.collectInstance){
        action.push(function (cb) {
            updateServiceCollectInstanceConfig(serviceInfo, config.collectInstance, cb, true);
        })
    }
    if(config.pointConfig){
        action.push(function (cb) {
            updatePointConfig(config.pointConfig, cb);
        })
    }
    if(config.pointBindingConfig){
        action.push(function (cb) {
            updatePointBindingConfig(config.pointBindingConfig, cb, true);
        })
    }

    ah.series(action, function (err) {
        if(err){
            callback(err);
            return;
        }

        callback(err);
    })
}

function import_service_config(config, callback) {
    var serviceInfo = config.serviceInfo;
    var action = [];

    if(config.instance){
        action.push(function (cb) {
            updateServiceInstanceConfig(serviceInfo, config.instance, cb);
        })
    }
    if(config.collectInstance){
        action.push(function (cb) {
            updateServiceCollectInstanceConfig(serviceInfo, config.collectInstance, cb);
        })
    }
    if(config.pointConfig){
        action.push(function (cb) {
            updatePointConfig(config.pointConfig, cb);
        })
    }
    if(config.pointBindingConfig){
        action.push(function (cb) {
            updatePointBindingConfig(config.pointBindingConfig, cb);
        })
    }

    ah.series(action, function (err) {
        if(err){
            callback(err);
            return;
        }

        callback(err);
    })
}

function export_service_config(serverNO, callback) {
    var rdbNO = ramdb.no;
    var rdbNOR = ramdb.nor;

    var rdbCNO = ramdb.cno;
    var rdbCNOR = ramdb.cnor;

    var dbDP = db.dp;

    var config = {};

    var instance = [];
    var collectInstance = [];
    var pointConfig = [];
    var pointBindingConfig = [];

    config.serviceInfo = {serverNO: serverNO};
    config.instance = instance;
    config.collectInstance = collectInstance;
    config.pointConfig = pointConfig;
    config.pointBindingConfig = pointBindingConfig;

    var export_instance = function (done) {
        var format_object = function (obj) {
            return {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, name: obj.name, description: obj.description, restData: obj.gen_rest_data(), createTime: obj.createTime, modifyTime: obj.modifyTime};
        };

        var export_object = function (container, identity, cbObject) {
            var obj = rdbNO.get_by_identity(identity);
            if(obj){
                var _areaContainer = rdbNOR.get_parent_identity(identity.serverNO, identity.classID, identity.id);
                if(_areaContainer){
                    instance.push({container: _areaContainer.concat([container]), object: format_object(obj)});
                }else{
                    instance.push({container: container, object: format_object(obj)});
                }
            }
            if(obj && obj.classID >= uiclassID.device && obj.classID <= uiclassID.lastDevice){
                dbDP.find_device_point({deviceServerNO: obj.serverNO, deviceClassID: obj.classID, deviceID: obj.id}, {_id: 0, pointIndex: 1, binding: 1, config: 1, option: 1}, function (err, results) {
                    if(err) return cbObject(err);

                    if(results && results.length > 0){
                        var pointConfigItem = {
                            serverNO: obj.serverNO,
                            classID: obj.classID,
                            id: obj.id,
                            points: []
                        };
                        var pointBindingConfigItem = {
                            serverNO: obj.serverNO,
                            classID: obj.classID,
                            id: obj.id,
                            points: []
                        };

                        for(var i in results){
                            var item = results[i];

                            pointConfigItem.points.push({
                                pointIndex: item.pointIndex,
                                config: item.config,
                                option: item.option
                            });
                            pointBindingConfigItem.points.push({
                                pointIndex: item.pointIndex,
                                binding: item.binding
                            })
                        }

                        pointConfig.push(pointConfigItem);
                        pointBindingConfig.push(pointBindingConfigItem);
                    }

                    var childs = rdbNOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
                    if(childs && childs.length > 0){
                        ah.each_series(childs, function (child, cbItem) {
                            export_object(identity, child, cbItem);
                        }, function (err) {
                            cbObject(err)
                        });
                    }else{
                        cbObject();
                    }
                });
            }else{
                var childs = rdbNOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
                if(childs && childs.length > 0){
                    ah.each_series(childs, function (child, cbItem) {
                        export_object(identity, child, cbItem);
                    }, function (err) {
                        cbObject(err)
                    });
                }else{
                    cbObject();
                }
            }
        };

        var park = undefined;

        var parks = rdbNO.get_by_class(uiclassID.park);
        if(parks && parks.length > 0){
            park = parks[0];
            if(park){
                var _park = format_object(park);
                instance.push({container: {serverNO: defaultServerNO, classID: 0, id: 0}, object: _park});
                var buildings = rdbNOR.get_child_identity(park.serverNO, park.classID, park.id, uiclassID.building);
                if(buildings && buildings.length > 0){
                    ah.each_series(buildings, function (building, cbItem) {
                        if(building.serverNO == serverNO){
                            export_object({serverNO: _park.serverNO, classID: _park.classID, id: _park.id}, building, cbItem);
                        }else{
                            cbItem();
                        }
                    }, function (err) {
                        done(err);
                    });
                }
            }else{
                done();
            }
        }else{
            done();
        }
    };

    var export_collect_instance = function (done) {
        var format_collect_object = function (obj) {
            return {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, description: obj.description, restData: obj.gen_rest_data(), createTime: obj.createTime, modifyTime: obj.modifyTime};
        };

        var export_collect_object = function (container, identity) {
            var obj = rdbCNO.get_by_identity(identity);
            if(obj){
                collectInstance.push({container: container, object: format_collect_object(obj)});
                var childs = rdbCNOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
                if(childs && childs.length > 0){
                    for(var i in childs){
                        export_collect_object(identity, childs[i]);
                    }
                }
            }
        };

        var collectors = rdbCNOR.get_child_identity_range(serverNO, 0, 0, uiclassID.collector);
        if(collectors && collectors.length > 0){
            for(var i in collectors){
                var item = collectors[i];
                if(item.serverNO == serverNO){
                    export_collect_object({serverNO: serverNO, classID: 0, id: 0}, item);
                }
            }
        }

        done();
    };

    ah.series([export_instance, export_collect_instance], function (err) {
        if(err) return callback(err);

        callback(null, config);
    })
}


module.exports.import_ecc_config = import_ecc_config;
module.exports.import_ecc_ext_config = import_ecc_ext_config;

module.exports.import_service_config = import_service_config;
module.exports.import_service_ext_config = import_service_ext_config;

module.exports.export_ecc_config = export_ecc_config;
module.exports.export_service_config = export_service_config;