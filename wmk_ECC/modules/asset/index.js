/**
 * Created by wangxh on 2018/7/16.
 */

'use strict';

var logger = require('../../util/log_manager').logger;
var ObjectState = require('../../definition/object_state');

var db = require('../../db');
var dbAsset = db.asset;

function init(done) {
    //每天清理一次已删除的数据
    setInterval(function () {
        dbAsset.clear_invalid_data(ObjectState.deleted, new Date().AddDays(-1), function (err) {
            if(err) logger.error({msg: 'clear asset data failed', err: err});
        })
    }, 24 * 60 * 60 * 1000);

    done();
}

module.exports.init = init;