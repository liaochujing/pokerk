/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;

    var ramdb = db.ramdb;
    var dbNO = ramdb.no;
    var dbNOR = ramdb.nor;

    var identity = body.identity;
    if(!identity){
        identity = {serverNO: defaultServerNO, classID: 0, id: 0};
    }

    function get_all_childs(identity) {
        var result = [];

        // if((identity.classID >= uiclassID.area && identity.classID <= uiclassID.lastArea) || identity.classID == 0){
            var childs = dbNOR.get_child_identity(identity.serverNO, identity.classID, identity.id);
            if(childs && childs.length > 0){
                for(var i=0;i<childs.length;i++){
                    var identity = childs[i];
                    var obj = dbNO.get_by_identity(identity);
                    if(obj){
                        var item = {serverNO: obj.serverNO, classID: obj.classID, id: obj.id, name: obj.fullName};
                        var childItems = get_all_childs(item);
                        if(childItems && childItems.length > 0){
                            item.children = childItems;
                        }
                        if(result){
                            result.push(item);
                        }
                    }
                }
            }
        // }

        return result;
    }

    callback(null, get_all_childs(identity));
}

module.exports.cmd = cmd.itr_0x00000002;
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
        }
    }
};