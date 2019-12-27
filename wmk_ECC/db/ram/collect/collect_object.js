/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';

var util = require('util');
var table_adapter = require('./../table_adapter');
var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var objectHelper = require('../../../objects/object_helper');
var cno = require('../../index').cno;

function collect_object_adapter() {
    var self = this;

    self.tb_name = 'collect_object';

    self.d_dic = {};
}

util.inherits(collect_object_adapter, table_adapter);

collect_object_adapter.prototype.init = function (param, callback) {
    var self = this;

    cno.find_collect_object({}, {}, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];

                var _device = objectHelper.createNameObject(item.classID);
                if (!_device) {
                    logger.error({msg: 'init device info failed', info: item});
                    continue;
                }
                _device.init_from_row(item);
                self.set_cno(_device);
            }}

        callback();
    });
};

collect_object_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.d_dic ={};

    self.init(callback);
};


collect_object_adapter.prototype.set_cno = function (no) {
    var self = this;

    if(!self.d_dic[no.serverNO]){
        self.d_dic[no.serverNO] = {};
    }
    if(!self.d_dic[no.serverNO][no.classID]){
        self.d_dic[no.serverNO][no.classID] = {};
    }
    self.d_dic[no.serverNO][no.classID][no.id] = no;
};

collect_object_adapter.prototype.del_cno = function (identity) {
    var self = this;
    if(self.d_dic[identity.serverNO] && self.d_dic[identity.serverNO][identity.classID]){
        delete self.d_dic[identity.serverNO][identity.classID][identity.id];
    }
};

collect_object_adapter.prototype.get_by_identity = function (identity) {
    if(identity && this.d_dic[identity.serverNO] && this.d_dic[identity.serverNO][identity.classID]){
        return this.d_dic[identity.serverNO][identity.classID][identity.id];
    }
    return undefined;
};

collect_object_adapter.prototype.get_cno_by_class = function (classID, serverNO) {
    var result = [];

    if(serverNO == undefined){
        for(var k in this.d_dic){
            var serverDic = this.d_dic[k];
            for(var i in serverDic){
                var classDic = serverDic[i];
                for(var j in classDic){
                    var item = classDic[j];
                    if(item.classID == classID){
                        result.push(item);
                    }
                }
            }
        }
    }else{
        var serverDic = this.d_dic[serverNO];
        if(serverDic){
            for(var i in serverDic){
                var classDic = serverDic[i];
                for(var j in classDic){
                    var item = classDic[j];
                    if(item.classID == classID){
                        result.push(item);
                    }
                }
            }
        }
    }


    return result;
};

module.exports = collect_object_adapter;