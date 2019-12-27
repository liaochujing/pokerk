/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');

var OperatorState = require('../../../definition/operator_state');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;

    var rdbOO = db.ramdb.oo;
    var rdbOOR = db.ramdb.oor;
    
    var response = [];

    var traverseNode = function (identity) {
        var obj = rdbOO.get_by_identity(identity);
        if(obj && (obj.classID == uiclassID.admin || obj.classID == uiclassID.operator)){
            if(obj.state == OperatorState.onDuty){
                var _parent = rdbOOR.get_parent_identity(obj.serverNO, obj.classID, obj.id);
                var parent = rdbOO.get_by_identity(_parent);

                var leader = undefined;
                if(parent && parent.leader){
                    leader = rdbOO.get_by_identity(parent.leader);
                }
                response.push({
                    serverNO: obj.serverNO,
                    classID: obj.classID,
                    id: obj.id,
                    fullName: obj.fullName,
                    groupName: parent.fullName,
                    leader: leader ? leader.fullName : ''
                })
            }
        }else{
            var childs = rdbOOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
            if(childs && childs.length > 0){
                for(var i in childs){
                    var item = childs[i];
                    traverseNode(item);
                }
            }
        }
    };

    traverseNode({serverNO: defaultServerNO, classID: 0, id: 0});

    callback(null, response);
}

module.exports.cmd = cmd.usr_0x00020003;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number'},
        classID: {type: 'number'},
        id: {type: 'number'}
    }
};