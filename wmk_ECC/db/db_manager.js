/**
 * Created by wangxh on 2018/4/3.
 */

'use strict';

var util = require('util');
var path = require('path');
var st = require('../util/small_tools');
var config = require('../config/db_config');

function backup(path, param, done) {
    var collections = [
        'alarm_type',
        'asset',
        'asset_type',
        'attribute',
        'collect_config',
        'collect_device_point',
        'collect_device_type',
        'collect_object',
        'collect_relation',
        'config_file',
        'device_type',
        'devicepoint',
        'nameobject',
        'nameobject_config',
        'objectids',
        'operator_object',
        'operator_relation',
        'order',
        'order_template',
        'parts',
        'parts_type',
        'privilege',
        'relation',
        'report_template',
        'supplier'
    ];
    if(param){
        if(param.alarm){
            collections.push('alarm');
        }
    }

    var cmd = util.format('cd %s', path);
    for(var i=0;i<collections.length;i++){
        cmd+=util.format(' && mongodump -h localhost -d %s -c %s -o ./', config.main.name, collections[i]);
    }

    st.executeShell(cmd, function (err) {
        if(err) return done(err);
        done();
    })
}

function restore(path, param, done) {
    var cmd = util.format('cd %s && mongorestore --drop -h localhost -d %s ./%s', path, config.main.name, config.main.name);
    st.executeShell(cmd, function (err) {
        if(err) return done(err);
        done();
    })
}

module.exports.backup = backup;
module.exports.restore = restore;