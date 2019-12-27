/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var uiclassID = require('../../../definition/uiClassID');
var PositionType = require('../../../definition/position_type');
var WST_STATE = require('../../../modules/user/definition/work_sheet_state');

var db = require('../../../db/index');

function handle(req, res, body, callback) {
    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);

    var dbWST = db.wst;

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

    var query = {state: WST_STATE.normal};
    if(!isManager){
        if(!isLeader){
            query.serverNO = user.group.serverNO;
            query.classID = user.group.classID;
            query.id = user.group.id;
        }else{
            var identitys = [];
            var rdbOO = db.ramdb.oo;
            var rdbOOR = db.ramdb.oor;
            var groups = rdbOO.get_by_class(uiclassID.operatorGroup);
            for(var i=0;i<groups.length;i++){
                var group = rdbOO.get_by_identity(groups[i]);
                if(group && group.leader && group.leader.serverNO == user.serverNO && group.leader.id == user.id){
                    identitys.push({serverNO: group.serverNO, classID: group.classID, id: group.id})
                }
            }
            if(identitys.length > 0){
                query['$or'] = identitys;
            }
        }
    }
    dbWST.count(query, function (err, count) {
       if(err) return callback(err);

        dbWST.find_work_sheet(query, {_id: 0, operationList: 0}).sort({state: 1, finishTime: -1}).skip(body.pageIndex * body.pageSize).limit(body.pageSize).exec(function (err, results) {
            if(err) return callback(err);
            var res = [];

            if(results){
                for(var i=0;i<results.length;i++){
                    var item = results[i];
                    res.push({
                        serverNO: item.serverNO,
                        classID: item.classID,
                        id: item.id,
                        sheetID: item.sheetID,
                        title: item.title,
                        content: item.content,
                        description: item.description,
                        createTime: item.createTime,
                        finishTime: item.finishTime
                    })
                }
            }

            callback(null, {total: count, pageSize: body.pageSize, pageIndex: body.pageIndex, list: res});
        });
    });
}

module.exports.cmd = cmd.usr_0x00010004;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        pageIndex: {type: 'number', required: true},
        pageSize: {type: 'number', required: true}
    }
};