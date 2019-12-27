/**
 * Created by wangxh on 2017/11/22.
 */

'use strict';


var util = require('util');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var table_adapter = require('./../table_adapter');
var nor = require('../../index').nor;

function relation_adapter() {
    var self = this;

    self.tb_name = 'relation';
    self.r_identity = {};
    self.r_parent = {};
}

util.inherits(relation_adapter, table_adapter);

relation_adapter.prototype.init = function (param, callback) {
    var self = this;

    nor.find_relation({}, {_id: 0}, function (err, result) {
        if(err){
            callback(err);
            return;
        }

        if(result){
            for(var i=0;i<result.length;i++){
                var item = result[i];
                self.add_nor(item);
            }
        }

        if(callback){
            callback();
        }
    });
};


relation_adapter.prototype.add_nor = function (item) {
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

relation_adapter.prototype.del_nor = function (identity) {
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

relation_adapter.prototype.del_relation = function (relation) {
    if(this.r_identity[relation.serverNO] && this.r_identity[relation.serverNO][relation.classID]){
        var childs = this.r_identity[relation.serverNO][relation.classID][relation.id];
        if(childs){
            for(var i=0;i<childs.length;i++){
                var item = childs[i];
                if(item.serverNO == relation.childServerNO && item.classID == relation.childClassID && item.id == relation.childID){
                    childs.splice(i, 1);
                    delete this.r_parent[relation.childServerNO][relation.childClassID][relation.childID];
                    break;
                }
            }
        }
    }
    if(this.r_parent[relation.childServerNO] && this.r_parent[relation.childServerNO][relation.childClassID]){
        delete this.r_parent[relation.childServerNO][relation.childClassID][relation.childID];
    }
};


relation_adapter.prototype.get_child_identity = function (parentServerNO, parentClassID, parentID, childClassID) {
    var self = this;
    var res = undefined;

    if(self.r_identity[parentServerNO] && self.r_identity[parentServerNO][parentClassID]){
        var arr = self.r_identity[parentServerNO][parentClassID][parentID];
        if(arr){
            if(childClassID != undefined){
                for(var i=0;i<arr.length;i++){
                    var temp = arr[i];
                    if(temp.classID == childClassID){
                        if(res == undefined){
                            res = [];
                        }
                        res.push(temp);
                    }
                }
            }else{
                res = arr;
            }
        }
    }

    return res || [];
};

relation_adapter.prototype.get_child_identity_range = function (parentServerNO, parentClassID, parentID, minClassID, maxClassID) {
    var res_arr = undefined;
    if(maxClassID == undefined){
        maxClassID = minClassID;
    }

    if(this.r_identity[parentServerNO] && this.r_identity[parentServerNO][parentClassID] && this.r_identity[parentServerNO][parentClassID][parentID]){
        var arr = this.r_identity[parentServerNO][parentClassID][parentID];
        if(arr){
            for(var i=0;i<arr.length;i++){
                var item = arr[i];
                if(item.classID >= minClassID && item.classID <= maxClassID){
                    if(!res_arr){
                        res_arr = [item]
                    }else{
                        res_arr.push(item);
                    }
                }else if(item.classID >= uiclassID.area && item.classID <= uiclassID.lastArea){
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
    }

    return res_arr;
};

relation_adapter.prototype.get_child_identity_dic = function (parentServerNO, parentClassID, parentID, dic) {
    var res_arr = undefined;

    if(this.r_identity[parentServerNO] && this.r_identity[parentServerNO][parentClassID] && this.r_identity[parentServerNO][parentClassID][parentID]){
        var arr = this.r_identity[parentServerNO][parentClassID][parentID];
        if(arr){
            for(var i=0;i<arr.length;i++){
                var item = arr[i];
                if(dic[item.classID]){
                    if(!res_arr){
                        res_arr = [item]
                    }else{
                        res_arr.push(item);
                    }
                }else if(item.classID >= uiclassID.area && item.classID <= uiclassID.lastArea){
                    var _temp = this.get_child_identity_dic(item.serverNO, item.classID, item.id, dic);
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
    }

    return res_arr;
};

relation_adapter.prototype.get_child_identity_list = function (parentServerNO, parentClassID, parentID, list) {
    var dic = {};
    for(var i=0;i<list.length;i++){
        var item = list[i];
        dic[item] = 1;
    }
    return this.get_child_identity_dic(parentServerNO, parentClassID, parentID, dic);
};

relation_adapter.prototype.get_child_identity_area = function (parentServerNO, parentClassID, parentID) {
    var res_arr = undefined;

    if(this.r_identity[parentServerNO] && this.r_identity[parentServerNO][parentClassID] && this.r_identity[parentServerNO][parentClassID][parentID]){
        var arr = this.r_identity[parentServerNO][parentClassID][parentID];
        if(arr){
            for(var i=0;i<arr.length;i++){
                var item = arr[i];
                if(item.classID >= uiclassID.area && item.classID <= uiclassID.lastArea && uiclassID != uiclassID.rowCabinet){
                    if(!res_arr){
                        res_arr = [item]
                    }else{
                        res_arr = res_arr.concat(_temp);
                    }
                    
                    var _temp = this.get_child_identity_area(item.serverNO, item.classID, item.id);
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
    }

    return res_arr;
};

relation_adapter.prototype.get_parent_identity = function (serverNO, classID, id, parentClassID) {
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

relation_adapter.prototype.get_parent_area_identity = function (serverNO, classID, id) {
    if(this.r_parent[serverNO]){
        if(this.r_parent[serverNO][classID]){
            var parent = this.r_parent[serverNO][classID][id];
            if(parent){
                if(parent.classID >= uiclassID.area && parent.classID <= uiclassID.room){
                    return parent;
                }else{
                    return this.get_parent_identity(parent.serverNO, parent.classID, parent.id);
                }
            }
        }
    }
    return undefined;
};

module.exports = relation_adapter;