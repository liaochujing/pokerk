/**
 * Created by wangxh on 2017/9/20.
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
        if(item.container){
            dbOOR.insert_relation(container.serverNO, container.classID, container.id, object.serverNO, object.classID, object.id, function (err) {
                if(err) return done(err);
                _no.insert_db(function (err) {
                    done(err)
                })
            });
        }else{
            _no.insert_db(function (err) {
                done(err);
            })
        }
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
            })
        });
    });
}

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

function updateInstanceConfig(configs, callback) {
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
        });
    };
    
    ah.series([function (cb) {
        dbNO.clear_nameobject({}, cb);
    }, function (cb) {
        dbNOR.clear_no_relation({}, cb);
    }, function (cb) {
        dbDP.clear_devicepoint({}, cb);
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
            dbObjID.update_object_id('nameobject', maxID, function (err) {
                callback(err);
            })
        });
    });
}

function updateCollectInstanceConfig(configs, callback) {
    var dbObjID = db.objID;
    var dbCNO = db.cno;
    var dbCNOR = db.cnor;

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

    ah.series([function (cb) {
        dbCNO.clear_collect_object({}, cb);
    }, function (cb) {
        dbCNOR.clear_cno_relation({}, cb);
    }], function (err) {
        if(err){
            callback(err);
            return;
        }
        ah.each_series(configs, function (item, next_action) {
            add_device(item, function (err) {
                next_action(err);
            })
        }, function (err) {
            if(err){
                callback(err);
                return;
            }
            dbObjID.update_object_id('collect_object', maxID, function (err) {
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


function import_config(config, callback) {
    var action = [];

    if(config.systemConfig){
        action.push(function (cb) {
            updateSystemConfig(config.systemConfig, cb);
        })
    }
    if(config.privilegeList){
        action.push(function (cb) {
            updatePrivilegeConfig(config.privilegeList, cb);
        })
    }
    if(config.operatorConfig){
        action.push(function (cb) {
            updateOperatorConfig(config.operatorConfig, cb);
        })
    }

    if(config.depList){
        action.push(function (cb) {
            updateDeviceTypeConfig(config.depList, cb);
        })
    }
    if(config.cdtList){
        action.push(function (cb) {
            updateCollectDeviceTypeConfig(config.cdtList, cb);
        })
    }
    if(config.alpList){
        action.push(function (cb) {
            updateAlarmTypeConfig(config.alpList, cb);
        })
    }
    if(config.astList){
        action.push(function (cb) {
            updateAssetTypeConfig(config.astList, cb);
        })
    }

    if(config.instance){
        action.push(function (cb) {
            updateInstanceConfig(config.instance, cb);
        })
    }
    if(config.collectInstance){
        action.push(function (cb) {
            updateCollectInstanceConfig(config.collectInstance, cb);
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

        callback();
    })
}

function export_base_config(callback) {
    var config = {};

    var depList = [];
    var cdtList = [];
    var alpList = [];
    var astList = [];
    var privilegeList = [];
    var operatorConfig = [];

    config.depList = depList;
    config.cdtList = cdtList;
    config.alpList = alpList;
    config.astList = astList;
    config.privilegeList = privilegeList;
    config.operatorConfig = operatorConfig;

    var rdbDEP = ramdb.dep;
    var rdbCDT = ramdb.cdt;
    var rdbALP = ramdb.alp;
    var rdbAST = ramdb.ast;
    var dbPrivilege = db.privilege;
    var rdbOO = ramdb.oo;
    var rdbOOR = ramdb.oor;

    var deviceTypes = rdbDEP.get_all_device_type();
    for(var i in deviceTypes){
        var item = deviceTypes[i];

        depList.push({
            system: item.system,
            systemName: item.systemName,
            group: item.group,
            groupName: item.groupName,
            id: item.id,
            name: item.name,
            desc: item.desc,
            pointList: item.pointList,
            config: item.config,
            time: item.time
        })
    }

    var collectDeviceTypes = rdbCDT.get_all_collect_device_type();
    for(var i in collectDeviceTypes){
        var item = collectDeviceTypes[i];

        cdtList.push({
            id: item.id,
            name: item.name,
            desc: item.desc,
            pointList: item.pointList,
            config: item.config,
            data: item.data,
            time: item.time
        })
    }

    var alarmTypes = rdbALP.get_all_alarm_type();
    for(var i in alarmTypes){
        var item = alarmTypes[i];

        alpList.push({
            id: item.id,
            name: item.name,
            condition: item.condition,
            config: item.config,
            option: item.option,
            time: item.time
        })
    }

    var assetTypes = rdbAST.get_all_asset_type();
    for(var i in assetTypes){
        var item = assetTypes[i];

        astList.push({
            system: item.system,
            name: item.name,
            desc: item.desc,
            groups: item.groups
        })
    }

    var export_privilege = function (done) {
        dbPrivilege.find_privilege({}, {_id: 0}, function (err, results) {
            if(err) return done(err);

            if(results){
                for(var i in results){
                    var item = results[i];

                    privilegeList.push({
                        id: item.id,
                        name: item.name,
                        desc: item.desc,
                        points: item.points
                    })
                }
            }

            done();
        })
    };

    var export_operator = function (done) {
        var format_object = function (obj) {
            return {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, description: obj.description, restData: obj.gen_rest_data(), createTime: obj.createTime, modifyTime: obj.modifyTime};
        };

        var export_object = function (container, identity) {
            var obj = rdbOO.get_by_identity(identity);
            if(obj){
                operatorConfig.push({container: container, object: format_object(obj)});
            }
            var childs = rdbOOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
            if(childs && childs.length > 0){
                for(var i in childs){
                    export_object(identity, childs[i]);
                }
            }
        };

        export_object(null, {serverNO: defaultServerNO, classID: 0, id: 0});

        done();
    };

    ah.series([export_privilege, export_operator], function (err) {
        if(err) return callback(err);

        callback(null, config);
    });
}

function export_config(callback) {
    var ramdb = db.ramdb;

    var config = {};

    var systemConfig = [];
    var privilegeList = [];
    var operatorConfig = [];
    var instance = [];
    var pointConfig = [];
    var pointBindingConfig = [];
    var collectInstance = [];

    config.systemConfig = systemConfig;
    config.privilegeList = privilegeList;
    config.operatorConfig = operatorConfig;
    config.instance = instance;
    config.pointConfig = pointConfig;
    config.pointBindingConfig = pointBindingConfig;
    config.collectInstance = collectInstance;

    var dbCFG = db.cfg;
    var dbDP = db.dp;
    var dbPrivilege = db.privilege;
    
    var rdbOO = ramdb.oo;
    var rdbOOR = ramdb.oor;
    var rdbNO = ramdb.no;
    var rdbNOR = ramdb.nor;
    var rdbCNO = ramdb.cno;
    var rdbCNOR = ramdb.cnor;

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

    var export_privilege = function (done) {
        dbPrivilege.find_privilege({}, {_id: 0}, function (err, results) {
            if(err) return done(err);

            if(results){
                for(var i in results){
                    var item = results[i];

                    privilegeList.push({
                        id: item.id,
                        name: item.name,
                        desc: item.desc,
                        points: item.points
                    })
                }
            }

            done();
        })
    };

    var export_operator = function (done) {
        var format_object = function (obj) {
            return {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, description: obj.description, restData: obj.gen_rest_data(), createTime: obj.createTime, modifyTime: obj.modifyTime};
        };

        var export_object = function (container, identity) {
            var obj = rdbOO.get_by_identity(identity);
            if(obj){
                operatorConfig.push({container: container, object: format_object(obj)});
            }
            var childs = rdbOOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
            if(childs && childs.length > 0){
                for(var i in childs){
                    export_object(identity, childs[i]);
                }
            }
        };

        export_object(null, {serverNO: defaultServerNO, classID: 0, id: 0});

        done();
    };

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

        export_object(null, {serverNO: defaultServerNO, classID: 0, id: 0}, done);
    };

    var export_collect_instance = function (done) {
        var format_collect_object = function (obj) {
            return {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, description: obj.description, restData: obj.gen_rest_data(), createTime: obj.createTime, modifyTime: obj.modifyTime};
        };

        var export_collect_object = function (container, identity) {
            var obj = rdbCNO.get_by_identity(identity);
            if(obj){
                collectInstance.push({container: container, object: format_collect_object(obj)});
            }
            var childs = rdbCNOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
            if(childs && childs.length > 0){
                for(var i in childs){
                    export_collect_object(identity, childs[i]);
                }
            }
        };

        export_collect_object(null, {serverNO: defaultServerNO, classID: 0, id: 0});

        done();
    };

    ah.series([export_system_config, export_privilege, export_operator, export_instance, export_collect_instance], function (err) {
        if(err) return callback(err);

        callback(null, config);
    })
}


module.exports.import_config = import_config;
module.exports.export_base_config = export_base_config;
module.exports.export_config = export_config;