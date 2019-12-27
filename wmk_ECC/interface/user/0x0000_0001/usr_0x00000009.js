/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var ramdb = db.ramdb;
    var dbOO = ramdb.oo;
    var dbOOR = ramdb.oor;

    let community = undefined;//人员所属社区id
    var user = req.user;

    if(!body.community){
        var _user = db.ramdb.oo.get_by_identity(user);
        if(_user){
            community = _user.community;
        }
    }else{
        community = body.community;
    }

    var admin = dbOO.get_operator_by_account('admin');
    let isadmin = false;
    if(admin != null && _user != null && admin.id == _user.id){
        isadmin = true;
    }

    var identity = body.identity;
    if(!identity){
        identity = {serverNO: defaultServerNO, classID: 0, id: 0};
    }
    var _operator = body.operator;

    function get_childs(identity) {
        var result = undefined;
        var childs = dbOOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
        for(var i=0;i<childs.length;i++){
            var identity = childs[i];
            if(isadmin && identity.classID == uiclassID.adminGroup){
                var obj = dbOO.get_operator_group(identity);
                if(obj){
                    var item = {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, leader: obj.leader, director: obj.director, inspector: obj.inspector};
                    var childItems = get_childs(item);
                    if(childItems && childItems.length > 0){
                        item.children = childItems;
                    }
                    if(!result){
                        result = [];
                    }
                    result.push(item);
                }
            }else if(identity.classID == uiclassID.operatorGroup){//过滤系统管理员
                var obj = dbOO.get_operator_group(identity);
                if(obj){
                    if(community != null && obj.community != community){
                        continue;
                    }
                    var item = {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, leader: obj.leader, director: obj.director, inspector: obj.inspector};
                    var childItems = get_childs(item);
                    if(childItems && childItems.length > 0){
                        item.children = childItems;
                    }
                    if(!result){
                        result = [];
                    }
                    result.push(item);
                }
            }else if(identity.classID == uiclassID.operator && (_operator === undefined || _operator == 1)){
                var obj = dbOO.get_operator(identity);
                if(obj){
                    if(community != null && obj.community != community){
                        continue;
                    }
                    var item = {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, fullName: obj.fullName, position: obj.position, contact: obj.contact, community: obj.community};
                    if(!result){
                        result = [];
                    }
                    result.push(item);
                }
            }
        }
        return result;
    }

    callback(null, get_childs(identity));
}

module.exports.cmd = cmd.usr_0x00000009;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        identity: {
            type: 'object',
            properties: {
                serverNO: {type: 'number', required: true},
                classID: {type: 'number', required: true},
                id: {type: 'number', required: true}
            }
        },
        operator: {type: 'number', enum: [0,1]},
        community: {type: 'integer'}
    }
};