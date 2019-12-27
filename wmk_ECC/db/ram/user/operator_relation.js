/**
 * Created by wangxh on 2017/11/9.
 */

'use strict';

var util = require('util');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var table_adapter = require('../table_adapter');
var oor = require('../../index').oor;

function operator_relation_adapter() {
    var self = this;

    self.tb_name = 'operator_relation';

    self.r_identity = {};
    self.r_parent = {};
}

util.inherits(operator_relation_adapter, table_adapter);

operator_relation_adapter.prototype.init = function (param, callback) {
    var self = this;

    oor.find_relation({}, {_id: 0}, function (err, result) {
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];

                self.add_oor(item);
            }}

        if(callback){
            callback();
        }
    });
};

operator_relation_adapter.prototype.add_oor = function (item) {
    var self = this;

    var serverNO = item.serverNO;
    var classID = item.classID;
    var id = item.id;

    var cServerNO = item.childServerNO;
    var cClassID = item.childClassID;
    var cID = item.childID;

    var parent = {
        serverNO: serverNO,
        classID: classID,
        id: id
    };
    var child = {
        serverNO: cServerNO,
        classID: cClassID,
        id: cID
    };

    if(!self.r_identity[serverNO]){
        self.r_identity[serverNO] = {};
    }
    if(!self.r_identity[serverNO][classID]){
        self.r_identity[serverNO][classID] = {};
    }
    if(!self.r_identity[serverNO][classID][id]){
        self.r_identity[serverNO][classID][id] = [];
    }
    self.r_identity[serverNO][classID][id].push(child);

    if(!self.r_parent[cServerNO]){
        self.r_parent[cServerNO] = {};
    }
    if(!self.r_parent[cServerNO][cClassID]){
        self.r_parent[cServerNO][cClassID] = {};
    }
    self.r_parent[cServerNO][cClassID][cID] = parent;
};

operator_relation_adapter.prototype.del_oor = function (identity) {
    var _parent = this.get_parent_identity(identity.serverNO, identity.classID, identity.id);
    if(_parent){
        var childs = this.get_child_identity(_parent.serverNO, _parent.classID, _parent.id);
        for(var i=0;i<childs.length;i++){
            var item = childs[i];
            if(item.serverNO == identity.serverNO && item.classID == identity.classID && item.id == identity.id){
                childs.splice(i, 1);
                break;
            }
        }
        delete this.r_parent[identity.serverNO][identity.classID][identity.id];
    }
};

operator_relation_adapter.prototype.get_child_identity = function (parentServerNO, parentClassID, parentID) {
    if(this.r_identity[parentServerNO]){
        if(this.r_identity[parentServerNO][parentClassID]){
            return this.r_identity[parentServerNO][parentClassID][parentID] || [];
        }
    }
    return []
};

operator_relation_adapter.prototype.get_parent_identity = function (serverNO, classID, id) {
    if(this.r_parent[serverNO]){
        if(this.r_parent[serverNO][classID]){
            return this.r_parent[serverNO][classID][id];
        }
    }
    return undefined;
};

module.exports = operator_relation_adapter;