/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var PositionType = require('../../../definition/position_type');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);

    var dbWLG = db.wlg;

    var isManager = false;
    var isLeader = false;
    if(user.classID == uiclassID.admin || user.group.classID == uiclassID.adminGroup){
        isManager = true;
    }else if(_user){
        if(_user.position == PositionType.director || _user.position == PositionType.inspector){
            isManager = true;
        }else if(_user.position == PositionType.leader){
            isLeader = true;
        }
    }

    var query = {createTime: {$gte: new Date().GetDate(), $lt: new Date()}};
    if(!isManager){
        if(!isLeader){
            query.serverNO = user.serverNO;
            query.classID = user.classID;
            query.id = user.id;
        }else{
            var rdbOO = db.ramdb.oo;
            var rdbOOR = db.ramdb.oor;

            var identitys = [];
            var groups = rdbOO.get_by_class(uiclassID.operatorGroup);
            for(var i=0;i<groups.length;i++){
                var group = rdbOO.get_by_identity(groups[i]);
                if(group && group.leader && group.leader.serverNO == user.serverNO && group.leader.id == user.id){
                    var users = rdbOOR.get_child_identity(group.serverNO, group.classID, group.id);
                    identitys = identitys.concat(users);
                }
            }
            if(identitys.length > 0){
                query['$or'] = identitys;
            }
        }
    }
    dbWLG.count(query, function (err, count) {
       if(err) return callback(err);

        dbWLG.find_work_log(query, {_id: 0}).sort({createTime: -1}).skip(body.pageIndex * body.pageSize).limit(body.pageSize).exec(function (err, results) {
            var res = [];

            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    res.push({
                        serverNO: item.serverNO,
                        classID: item.classID,
                        id: item.id,
                        logID: item.logID,
                        content: item.content,
                        createTime: item.createTime,
                        modifyTime: item.modifyTime
                    })
                }
            }

            callback(null, {total: count, pageSize: body.pageSize, pageIndex: body.pageIndex, list: res});
        });
    });
}

module.exports.cmd = cmd.usr_0x00010008;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        pageIndex: {type: 'number', required: true},
        pageSize: {type: 'number', required: true}
    }
};