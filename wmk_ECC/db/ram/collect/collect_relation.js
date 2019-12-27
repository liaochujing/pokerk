/**
 * Created by wangxh on 2017/11/20.
 */


'use strict';

var util = require('util');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var table_adapter = require('../table_adapter');
var cnor = require('../../index').cnor;

function collect_relation_adapter() {
    var self = this;

    self.tb_name = 'collect_relation';

    self.r_identity = {};
    self.r_parent = {};
}

util.inherits(collect_relation_adapter, table_adapter);

collect_relation_adapter.prototype.init = function (param, callback) {
    var self = this;

    cnor.find_relation({}, {_id: 0}, function (err, result) {
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];

                self.add_cnor(item);
            }}

        if(callback){
            callback();
        }
    });
};

collect_relation_adapter.prototype.add_cnor = function (item) {
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

collect_relation_adapter.prototype.del_cnor = function (identity) {
    var _parent = this.get_parent_identity(identity.serverNO, identity.classID, identity.id);
    if(_parent){
        if(this.r_identity[_parent.serverNO] && this.r_identity[_parent.serverNO][_parent.classID]){
            var childs = this.r_identity[_parent.serverNO][_parent.classID][_parent.id];
            if(childs){
                for(var i=0;i<childs.length;i++){
                    var item = childs[i];
                    if(item.serverNO == identity.serverNO && item.classID == identity.classID && item.id == identity.id){
                        childs.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }
    if(this.r_parent[identity.serverNO] && this.r_parent[identity.serverNO][identity.classID]){
        delete this.r_parent[identity.serverNO][identity.classID][identity.id];
    }
};

collect_relation_adapter.prototype.get_child_identity_range = function (parentServerNO, parentClassID, parentID, minClassID, maxClassID) {
    var res_arr = undefined;
    if(maxClassID == undefined){
        maxClassID = minClassID;
    }

    if(this.r_identity[parentServerNO] && this.r_identity[parentServerNO][parentClassID] && this.r_identity[parentServerNO][parentClassID][parentID]){
        var arr = this.r_identity[parentServerNO][parentClassID][parentID];
        for(var i=0;i<arr.length;i++){
            var item = arr[i];
            if(item.classID >= minClassID && item.classID <= maxClassID){
                if(!res_arr){
                    res_arr = [item]
                }else{
                    res_arr.push(item);
                }
            }else{
                var _temp = this.get_child_identity_range(item.serverNO, item.classID, item.id, minClassID, maxClassID);
                if(_temp){
                    if(!res_arr){
                        res_arr = _temp
                    }else{
                        res_arr = res_arr.concat(_temp);
                    }
                }
            }
        }
    }

    return res_arr;
};

collect_relation_adapter.prototype.get_child_identity = function (parentServerNO, parentClassID, parentID) {
    if(this.r_identity[parentServerNO]){
        if(this.r_identity[parentServerNO][parentClassID]){
            return this.r_identity[parentServerNO][parentClassID][parentID] || [];
        }
    }

    return []
};

collect_relation_adapter.prototype.get_parent_identity = function (serverNO, classID, id, parentClassID) {
    if(this.r_parent[serverNO]){
        if(this.r_parent[serverNO][classID]){
            var parent = this.r_parent[serverNO][classID][id];
            if(parentClassID == undefined){
                return parent;
            }else{
                if(parent){
                    if(parent.classID == parentClassID){
                        return parent;
                    }else{
                        return this.get_parent_identity(parent.serverNO, parent.classID, parent.id, parentClassID);
                    }
                }else{
                    return undefined;
                }
            }
        }
    }
    return undefined;
};

module.exports = collect_relation_adapter;