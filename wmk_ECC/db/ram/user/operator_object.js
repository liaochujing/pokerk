/**
 * Created by wangxh on 2017/11/9.
 */

'use strict';

var util = require('util');
var logger = require('../../../util/log_manager').logger;
var table_adapter = require('../table_adapter');
var objectHelper = require('../../../objects/object_helper');
var dbOO = require('../../index').oo;

var ObjectState = require('../../../definition/object_state');
var uiclassID = require('../../../definition/uiClassID');

function operator_adapter() {
    var self = this;

    self.tb_name = 'operator_object';

    self.og_dic = {};
    self.o_dic = {};
    self.a_dic = {};
    self.c_dic = {};
}

util.inherits(operator_adapter, table_adapter);

operator_adapter.prototype.init = function (param, callback) {
    var self = this;

    dbOO.find_operator_object({_state: {$ne: ObjectState.deleted}}, {_id: 0}, function(err, result){
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];
                var no = objectHelper.createNameObject(item.classID);
                if (!no) {
                    logger.error({msg: 'init operator object failed', info: item});
                    continue;
                }
                no.init_from_row(item);

                self.set_oo(no);
            }
        }

        callback();
    });
};

operator_adapter.prototype.reinit = function (callback) {
    var self = this;

    self.og_dic = {};
    self.o_dic = {};
    self.a_dic = {};
    self.c_dic = {};

    self.init(callback);
};


operator_adapter.prototype.set_oo = function (no) {
    if(no.classID == uiclassID.operator || no.classID == uiclassID.admin){
        if(!this.o_dic[no.serverNO]){
            this.o_dic[no.serverNO] = {};
        }
        this.o_dic[no.serverNO][no.id] = no;

        if(no.account){
            this.a_dic[no.account] = no;
        }
    }else{
        if(!this.og_dic[no.serverNO]){
            this.og_dic[no.serverNO] = {};
        }
        this.og_dic[no.serverNO][no.id] = no;
    }
    if(!this.c_dic[no.classID]){
        this.c_dic[no.classID] = [];
    }
    this.c_dic[no.classID].push(no);
};

operator_adapter.prototype.del_oo = function (identity) {
    if(identity.classID == uiclassID.operator || identity.classID == uiclassID.admin){
        var operator = this.get_by_identity(identity);
        if(operator){
            delete this.a_dic[operator.account];
        }
        if(this.o_dic[identity.serverNO]){
            delete this.o_dic[identity.serverNO][identity.id];
        }
    }else{
        if(this.og_dic[identity.serverNO]){
            delete this.og_dic[identity.serverNO][identity.id];
        }
    }
    var c_arr = this.c_dic[identity.classID];
    if(c_arr){
        for(var i=0;i<c_arr.length;i++){
            var item = c_arr[i];
            if(item.serverNO == identity.serverNO && item.classID == identity.classID && item.id == identity.id){
                c_arr.splice(i, 1);
                break;
            }
        }
    }
};

operator_adapter.prototype.get_operator = function (identity) {
    if(identity){
        if(this.o_dic[identity.serverNO]){
            return this.o_dic[identity.serverNO][identity.id];
        }
    }
    return undefined;
};

operator_adapter.prototype.get_operator_by_id = function (id) {
    if(this.o_dic[defaultServerNO]){
        return this.o_dic[defaultServerNO][id];
    }
    return undefined;
};

operator_adapter.prototype.get_operator_group = function (identity) {
    if(identity){
        if(this.og_dic[identity.serverNO]){
            return this.og_dic[identity.serverNO][identity.id];
        }
    }
    return undefined;
};

operator_adapter.prototype.get_group_by_id = function (id) {
    if(this.og_dic[defaultServerNO]){
        return this.og_dic[defaultServerNO][id];
    }
    return undefined;
};

operator_adapter.prototype.get_operator_by_account = function (account) {
    return this.a_dic[account];
};

operator_adapter.prototype.get_by_class = function (classID) {
    return this.c_dic[classID] || [];
};

operator_adapter.prototype.get_by_class_list = function (list) {
    var result = [];

    for(var i=0;i<list.length;i++){
        result = result.concat(this.get_by_class(list[i]));
    }

    return result;
};

operator_adapter.prototype.get_by_identity = function (identity) {
    if(identity.classID == uiclassID.operator || identity.classID == uiclassID.admin){
        return this.get_operator(identity)
    }else{
        return this.get_operator_group(identity)
    }
};


module.exports = operator_adapter;