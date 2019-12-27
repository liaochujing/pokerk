/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var sys_cfg_key = require('../../../modules/order/definition/system_config_key');
var db = require('../../../db');
var rdbInspectionData = db.ramdb.inspection_data;
var rdbNO = db.ramdb.no;
var rdbCFG = db.ramdb.cfg;

function handle(req, res, body, callback) {
    var response = [];

    var _dic = {};
    var templates = rdbCFG.get_system_config(sys_cfg_key.inspection_template);
    if(templates){
        for(var i=0;i<templates.length;i++){
            var item = templates[i];
            _dic[item.guid] = item.name;
        }
    }

    var _list = rdbInspectionData.get_inspection_data_list();
    for(var i=0;i<_list.length;i++){
        var item = _list[i];
        var room = rdbNO.get_by_identity(item);
        response.push({
            serverNO: item.serverNO,
            classID: item.classID,
            id: item.id,
            name: room ? room.fullName : '',
            guid: item.guid,
            template: _dic[item.guid] || ''
        })
    }

    callback(null, response);
}

module.exports.cmd = cmd.odr_0x0000002A;
module.exports.handle = handle;