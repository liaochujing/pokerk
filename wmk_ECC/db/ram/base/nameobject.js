/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';

var util = require('util');
var logger = require('../../../util/log_manager').logger;
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');
var objectHelper = require('../../../objects/object_helper');
var uiclassID = require('../../../definition/uiClassID');
var no = require('../../index').no;

function nameobject_adapter() {
    var self = this;

    self.tb_name = 'nameobject';

    self.no_dic = {};
    self.no_cls_dic = {};
    self.asset_dic = {};
}

util.inherits(nameobject_adapter, table_adapter);

nameobject_adapter.prototype.init = function (param, callback) {
    var self = this;

    no.find_all_nameobject(param, function(result){
        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];
                var no = objectHelper.createNameObject(item.classID);
                if (!no) {
                    logger.error({msg: 'init name object failed', info: item});
                    continue;
                }
                no.init_from_row(item);
                self.set_no(no);
            }
        }
    }, function (err) {
        if (err) return callback(err);
        callback(err);
    });
};

nameobject_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.no_dic = {};
    self.no_cls_dic = {};

    self.init(callback);
};


nameobject_adapter.prototype.set_no = function (no) {
    var self = this;

    self.no_dic[no.id] = no;

    if(self.no_cls_dic[no.serverNO] == undefined){
        self.no_cls_dic[no.serverNO] = {};
    }
    if(self.no_cls_dic[no.serverNO][no.classID] == undefined){
        self.no_cls_dic[no.serverNO][no.classID] = [];
    }
    self.no_cls_dic[no.serverNO][no.classID].push(no);

    if(no.aNO){
        self.asset_dic[no.aNO] = no;
    }
};

nameobject_adapter.prototype.del_no = function (identity) {
    var self = this;

    var object = self.get_by_identity(identity);
    if(object){
        delete self.no_dic[identity.id];

        if(self.no_cls_dic[identity.serverNO] && self.no_cls_dic[identity.serverNO][identity.classID]){
            var _arr = self.no_cls_dic[identity.serverNO][identity.classID];
            for(var i=0;i<_arr.length;i++){
                var item = _arr[i];
                if(item.serverNO == identity.serverNO && item.classID == identity.classID && item.id == identity.id){
                    _arr.splice(i, 1);
                    break;
                }
            }
        }
        if(object.aNO){
            delete self.asset_dic[object.aNO];
        }
    }
};


nameobject_adapter.prototype.get_no_sync = function (serverNO, classID, id) {
    return this.no_dic[id];
};

nameobject_adapter.prototype.get_by_identity = function (identity) {
    if(identity != undefined){
        return this.get_no_sync(identity.serverNO, identity.classID, identity.id);
    }
    return undefined;
};

nameobject_adapter.prototype.get_by_asset_no = function (aNO) {
    return this.asset_dic[aNO];
};

nameobject_adapter.prototype.get_building = function (serverNO) {
    var building = undefined;

    var _tmp = this.no_cls_dic[serverNO];
    if(_tmp != undefined){
        var nos = _tmp[uiclassID.building];
        if(nos != undefined && nos.length > 0){
            building = nos[0];
        }
    }

    return building;
};

nameobject_adapter.prototype.get_by_class = function (classID, serverNO) {
    if(serverNO != undefined){
        var _tmp = this.no_cls_dic[serverNO];
        if(_tmp != undefined){
            return _tmp[classID] || [];
        }else{
            return [];
        }
    }else{
        var result = [];
        for(var i in this.no_cls_dic){
            var temDic = this.no_cls_dic[i];
            if(temDic[classID]){
                result = result.concat(temDic[classID])
            }
        }
        return result;
    }
};

nameobject_adapter.prototype.get_by_class_rang = function (min_cls, max_cls, serverNO) {
    var array = [];

    if(serverNO != undefined){
        var tempDic = this.no_cls_dic[serverNO];
        if(tempDic){
            for (var i = min_cls; i < max_cls; i++) {
                var temp = tempDic[i];
                if(temp){
                    array = array.concat(temp)
                }
            }
        }
    }else{
        for(var k in this.no_cls_dic){
            var tempDic = this.no_cls_dic[k];
            for (var i = min_cls; i < max_cls; i++) {
                var temp = tempDic[i];
                if(temp){
                    array = array.concat(temp)
                }
            }
        }
    }

    return array
};

nameobject_adapter.prototype.get_by_class_list = function (list, serverNO) {
    var array = [];

    if(serverNO != undefined){
        var tempDic = this.no_cls_dic[serverNO];
        if(tempDic != undefined){
            for (var i = 0;i<list.length;i++) {
                var temp = tempDic[i];
                if(temp){
                    array = array.concat(temp)
                }
            }
        }
    }else{
        for(var k in this.no_cls_dic){
            var tempDic = this.no_cls_dic[k];
            for (var i = 0;i<list.length;i++) {
                var temp = tempDic[i];
                if(temp){
                    array = array.concat(temp)
                }
            }
        }
    }

    return array
};

module.exports = nameobject_adapter;