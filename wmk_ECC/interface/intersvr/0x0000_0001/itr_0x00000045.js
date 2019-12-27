/**
 * Created by Chujing Liao on 2019/12/11.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var logger = require('../../../util/log_manager').logger;
var uiclassID = require('../../../definition/uiClassID');
var serverHelper = require('../../../protocol/central/interface_helper');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var rdbNO = ramdb.no;
var rdbNOR = ramdb.nor;

function handle(req, res, body, callback) {
    var _class_dic = {};
    var _class_list = [];
        if (body.serverNO == 0){
            for (var i in rdbNO.no_dic){
                var _device_classid = rdbNO.no_dic[i].classID;
                if (_device_classid >= uiclassID.device &&_device_classid <= uiclassID.lastDevice){
                    if (!_class_dic[_device_classid]){
                        _class_dic[_device_classid] = 1;
                        _class_list.push(_device_classid)
                    }
                }
            }
        }
        else{
            function get_class_list(obj) {
                if (obj.classID>= uiclassID.device && obj.classID <= uiclassID.lastDevice){
                    if (!_class_dic[obj.classID]){
                        _class_dic[obj.classID] = 1;
                        _class_list.push(obj.classID);
                    }
                }
                var children = rdbNOR.get_child_identity(obj.serverNO,obj.classID,obj.id);
                if (children && children.length > 0){

                    for (var j = 0; j < children.length; j ++){
                        get_class_list(children[j])
                    }
                }
            }
            var area = body;

            get_class_list(area);
        }

        var response = _class_list;
        callback(null, response);
}

module.exports.cmd = cmd.itr_0x00000045;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        serverNO: {type: 'number', required: true},
        classID: {type: 'number', required: true},
        id: {type: 'number', required: true}
    }
};