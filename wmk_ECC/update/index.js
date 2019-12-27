/**
 * Created by wangxh on 2018/1/21.
 */

'use strict';

var ah = require('../util/array_helper');
var exec = require('child_process').exec;
var db_config = require('../config/db_config');
var mongoose = require('mongoose');
var options = {
    server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 }, reconnectTries: Number.MAX_VALUE, reconnectInterval: 3000 },
    replset: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }
};
var db = undefined; 

function ensure_index_main(callback) {
    var cmd = 'mongo localhost/' + db_config.main.name + ' EnsureIndex.sh';
    exec(cmd, function (err, stdout, stderr) {
        if (err) {
            console.log(err);
            console.log(stderr);
            callback(err);
        } else {
            console.log(stdout);
            callback();
        }
    });
}

function ensure_index_data(callback) {
    var cmd = 'mongo localhost/' + db_config.data.name + ' EnsureIndex-data.sh';
    exec(cmd, function (err, stdout, stderr) {
        if (err) {
            console.log(err);
            console.log(stderr);
            callback(err);
        } else {
            console.log(stdout);
            callback();
        }
    });
}

function update_privilege_point(callback) {
    var cmd = 'mongo localhost/' + db_config.main.name + ' ./update/main_update.sh';
    exec(cmd, function (err, stdout, stderr) {
        if (err) {
            console.log(err);
            console.log(stderr);
            callback(err);
        } else {
            console.log(stdout);
            callback();
        }
    });
}

function open_db(callback){
    db = mongoose.createConnection(db_config.main.url, options);

    db.on('error', function (err) {
        console.log(err);
        db = undefined;
        callback();
        return;
    });
    db.once('open', function () {
        callback();
        return;
    });
}

function update_role(callback) {
    if(!db){
        return callback();
    }

    var dbRole = require('../db/main/user/role')(db);
    dbRole.count({}, function (err, count) {
        if (err) {
            console.log(err);
            callback();
        } else {
            console.log(count);
            if (count == 0) {
                var objID = require('../db/main/base/objectid')(db);
                var positionType = require('../definition/position_type');
                var list = [
                    { type: positionType.worker, name: '值班工程师', option: {} },
                    { type: positionType.worker, name: '动环工程师', option: {} },
                    { type: positionType.worker, name: '维护工程师', option: {} },
                    { type: positionType.leader, name: '值班班长', option: {} },
                    { type: positionType.director, name: '值班主管', option: {} },
                    { type: positionType.director, name: '维护主管', option: {} },
                    { type: positionType.director, name: '暖通主管', option: {} },
                    { type: positionType.director, name: '电气主管', option: {} },
                    { type: positionType.director, name: '弱电主管', option: {} },
                    { type: positionType.inspector, name: '机房经理', option: {} },
                    { type: positionType.expert, name: '设施专家', option: {} }
                ];

                ah.each_series(list, function (item, cbNextItem) {
                    objID.gen_object_id('role', function (err, id) {
                        if (err) {
                            logger.error(err);
                            cbNextItem(err);
                        } else {
                            dbRole.insert_role(id, item.type, item.name, item.option, function (err) {
                                cbNextItem(err);
                            });
                        }
                    });
                }, function (err) {
                    if (err) {
                        logger.error(err);
                    }
                    callback();
                });
            } else {
                callback();
            }
        }
    });
}


console.log('-- start --');
ah.series([ensure_index_main, ensure_index_data/*, update_privilege_point, open_db, update_role*/], function (err) {
    if(err){
        console.log(err);
    }
    console.log('-- end --');
    process.exit(0)
});