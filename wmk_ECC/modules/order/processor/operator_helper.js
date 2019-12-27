/**
 * Created by wangxh on 2017/11/9.
 */

'use strict';

var uiclassID = require('../../../definition/uiClassID');
var OperatorState = require('../../../definition/operator_state');

var db = require('../../../db/index');
var rdbOO = db.ramdb.oo;
var rdbOOR = db.ramdb.oor;

//获取当前值班人
function get_on_duty(group) {
    var operators = [];

    var _group = rdbOO.get_group_by_id(group);
    if(_group){
        var childs = rdbOOR.get_child_identity(_group.serverNO, _group.classID, _group.id);
        var ids = [];
        if(childs){
            for(var i=0;i<childs.length;i++){
                var item = childs[i];
                if(item.classID == uiclassID.operator){
                    var operator = rdbOO.get_by_identity(item);
                    if(operator && operator.state == OperatorState.onDuty){
                        operators.push(operator.id);
                    }
                }
            }
        }
    }

    return operators;
}

//获取当前值班人
function get_on_duty_name(group) {
    var name = '';

    var _group = rdbOO.get_group_by_id(group);
    if(_group){
        var childs = rdbOOR.get_child_identity(_group.serverNO, _group.classID, _group.id);
        var ids = [];
        if(childs){
            for(var i=0;i<childs.length;i++){
                var item = childs[i];
                if(item.classID == uiclassID.operator){
                    var operator = rdbOO.get_by_identity(item);
                    if(operator && operator.state == OperatorState.onDuty){
                        if(name){
                            name += '、';
                        }
                        name+= operator.fullName;
                    }
                }
            }
        }
    }

    return name;
}

//获取组长
function get_group_leader(group) {
    var _group = rdbOO.get_group_by_id(group);
    if(_group && _group.leader){
        return _group.leader.id;
    }
    return undefined;
}

//主管
function get_group_director(group) {
    var _group = rdbOO.get_group_by_id(group);
    if(_group && _group.director){
        return _group.director.id;
    }
    return undefined;
}

//总监
function get_group_inspector(group) {
    var _group = rdbOO.get_group_by_id(group);
    if(_group && _group.inspector){
        return _group.inspector.id;
    }
    return undefined;
}

//获取上级
function get_user_leader(group, user) {
    var _group = rdbOO.get_group_by_id(group);
    if(_group){
        if(_group.leader && _group.leader.id == user){
            if(_group.director){
                return _group.director.id;
            }
        }else if(_group.director && _group.director.id == user){
            if(_group.inspector){
                return _group.inspector.id;
            }
        }else{
            var operator = rdbOO.get_operator_by_id(user);
            if(operator){
                var _g = rdbOOR.get_parent_identity(operator.serverNO, operator.classID, operator.id);
                if(_g.id == group){
                    if(_group.leader){
                        return _group.leader.id;
                    }
                }
            }
        }
    }

    return undefined;
}

module.exports.get_on_duty = get_on_duty;
module.exports.get_on_duty_name = get_on_duty_name;
module.exports.get_group_leader = get_group_leader;
module.exports.get_group_director = get_group_director;
module.exports.get_group_inspector = get_group_inspector;
module.exports.get_user_leader = get_user_leader;