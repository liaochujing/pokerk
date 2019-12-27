/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var db = require('../../../db/index');
var rdbNO = db.ramdb.no;
var rdbNOR = db.ramdb.nor;

function handle(req, res, body, callback) {
    var response = {};

    for(var i=0;i<body.length;i++){
        var item = body[i];

        var resItem = [];
        var obj = rdbNO.get_by_identity(item);
        if(obj){
            resItem.push({serverNO: obj.serverNO, classID: obj.classID, id: obj.id, name: obj.fullName});

            var _parent = rdbNOR.get_parent_identity(obj.serverNO, obj.classID, obj.id);
            while(_parent && _parent.id != 0){
                var _p = rdbNO.get_by_identity(_parent);
                if(_p){
                    resItem.splice(0, 0, {serverNO: _p.serverNO, classID: _p.classID, id: _p.id, name: _p.fullName});
                    _parent = rdbNOR.get_parent_identity(_p.serverNO, _p.classID, _p.id);
                }else{
                    break;
                }
            }
        }

        response[format_key(item.serverNO, item.classID, item.id)] = resItem;
    }

    callback(null, response);
}

module.exports.cmd = cmd.itr_0x00000010;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            serverNO: {type: 'integer', required: true},
            classID: {type: 'integer', required: true},
            id: {type: 'integer', required: true}
        }
    }
};