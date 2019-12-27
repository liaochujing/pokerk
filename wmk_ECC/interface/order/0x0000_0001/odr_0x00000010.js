/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var cfgKey = require('../../../modules/order/definition/system_config_key');
var OrderAction = require('../../../modules/order/definition/order_action_type');

var db = require('../../../db/index');
var ramdb = db.ramdb;
var dbOPL = db.datadb.opl;

function handle(req, res, body, callback) {
    var objID = db.objID;

    var user = req.user;

    var key = cfgKey.maintain_template;
    var value = body;

    var dbCFG = db.cfg;

    var newList = [];
    if(value){
        for(var i in value){
            var item = value[i];

            if(item.id == undefined){
                newList.push(item);
            }
        }
    }

    var gen_template_id = function (done) {
        if(newList.length > 0){
            objID.gen_object_id('morder_template', function (err, id) {
                if(err) return done(err);

                for(var i in newList){
                    var item = newList[i];

                    item.id = id++;
                }

                done();
            }, newList.length);
        }else{
            done();
        }
    };

    gen_template_id(function () {
        dbCFG.update_system_config(svrType, key, value, function (err) {
            if(err) return callback(err);

            ramdb.cfg.set_system_config(key, value);
            dbOPL.insert_user_log(OrderAction.maintain_template, user, '修改维护工单模板', value, new Date());

            callback();
        });
    });
}

module.exports.privilege = PrivilegePoint.setOrderConfig;
module.exports.cmd = cmd.odr_0x00000010;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            id: {type: 'number'},
            name: {type: 'string', required: true},
            deviceClassID: {type: 'number', required: true},
            templates: {
                type: 'array',
                items: {type: 'string'}
            }
        }
    }
};