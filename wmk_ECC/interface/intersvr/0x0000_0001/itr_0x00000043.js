/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var db = require('../../../db/index');
var ramdb = db.ramdb;
var rdbNO = ramdb.no;
var rdbNOR = ramdb.nor;

function handle(req, res, body, callback) {
    let list = rdbNOR.get_child_identity_range(body.serverNO, body.classID, body.id, uiclassID.device, uiclassID.lastDevice);
    if(list){
        let dic = {};
        for(let i=0;i<list.length;i++){
            let no = rdbNO.get_by_identity(list[i]);
            if(no){
                let _system = no.system || 0;
                if(!dic[_system]){
                    dic[_system] = 1;
                }else{
                    dic[_system]++;
                }
            }
        }
        callback(null, dic);
    }else{
        callback();
    }
}

module.exports.cmd = cmd.itr_0x00000043;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};