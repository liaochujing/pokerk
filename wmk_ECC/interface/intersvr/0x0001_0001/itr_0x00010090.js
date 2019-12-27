/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var PrivilegePoint = require('../../../definition/privilege_point');
var db = require('../../../db/index');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var dataHelper = require('../../../protocol/central/server_manager');
var servType = require('../../../definition/service_type');

function handle(req, res, body, callback) {
    var pageIndex = body.pageIndex || 0;
    var pageSize = body.pageSize || 1000;
    if(pageSize > 1000){
        pageSize = 1000;
    }else if(pageSize < 0){
        pageSize = 1000;
    }



    if(body.serverNO != null){
        //发送楼栋服务
        //.Requst({serverNO: 0, cmd: 0, type: 0, data: {...}})

        let sendData = {
            serverNO: body.serverNO,
            cmd: CentralCMD.cen_0x00030010,
            type: servType.intersvr,
            data: body
        }

        var msg = new DataMessage(CentralCMD.cen_0x00000000, sendData);
        dataHelper.send(msg, function (err, data) {
            if(err){
                return callback({status: code.other, msg: err.msg});
            }

            callback(null, data);
        });
    }else{
        function getIPAdress(){  
            var interfaces = require('os').networkInterfaces();  
            for(var devName in interfaces){  
                  var iface = interfaces[devName];  
                  for(var i=0;i<iface.length;i++){  
                       var alias = iface[i];  
                       if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){  
                             return alias.address;  
                       }  
                  }  
            }  
        }  
        
        let current = getIPAdress(); 
        let query = {};
    
        if(body.startTime) {
            if(!query.createtime) {
                query.createtime = {};
            }
            query.createtime.$gt = new Date(body.startTime);
        }
        if(body.endTime) {
            if(!query.createtime) {
                query.createtime = {};
            }
            query.createtime.$lt = new Date(body.endTime);
        }
    
        var hotstandby = db.datadb.hotstandby;
        hotstandby.count(query, function (err, count) { 
            if(err) return callback(err);
            hotstandby.find_hotstandby(query, {_id: 0}).sort({createTime: -1}).skip(pageIndex * pageSize).limit(pageSize).exec(function (err, results) {
                if(err) return callback(err);
                callback(null, {totalCount: count, list: results, current: current});
            })
        })
    }
}

module.exports.privilege = PrivilegePoint.queryReport;
module.exports.cmd = cmd.itr_0x00010090;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        startTime: {type: 'string'},
        endTime: {type: 'string'},
        pageIndex: {type: 'number'},
        pageSize: {type: 'number'},
        serverNO: {type: 'number'}
    }
};