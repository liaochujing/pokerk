/**
 * Created by wangxh on 2017/11/15.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');

var uiclassID = require('../../../definition/uiClassID');
var ObjectState = require('../../../definition/object_state');
var objectHelper = require('../../../objects/object_helper');
var dbAsset = require('../../index').asset;

function asset_adapter() {
    var self = this;

    self.tb_name = 'asset';

    self.assetDic = {};
}

util.inherits(asset_adapter, table_adapter);

asset_adapter.prototype.init = function (param, callback) {
    var self = this;
    dbAsset.find_assets({_state: {$ne: ObjectState.deleted}}, {_id: 0}, function (err, result) {
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];

                var asset = objectHelper.createNameObject(uiclassID.asset);
                asset.init_from_row(item);

                self.set_asset(asset);
            }
        }
        callback();
    });
};

asset_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.assetDic = {};

    self.init(callback);
};

asset_adapter.prototype.set_asset = function (asset) {
    var self = this;

    self.assetDic[asset.aNO] = asset;
};

asset_adapter.prototype.del_asset = function (aNO) {
    var self = this;
    delete self.assetDic[aNO]
};

asset_adapter.prototype.get_asset_sync = function (aNO) {
    return this.assetDic[aNO];
};

asset_adapter.prototype.get_all_asset = function () {
    return this.assetDic;
};

module.exports = asset_adapter;