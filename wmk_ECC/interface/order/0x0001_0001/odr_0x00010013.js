/**
 * Created by wangxh on 2017/7/25.
 */

'use strict';

var cmd = require('../cmd');
var code = require('../code');

var OrderState = require('../../../modules/order/definition/order_state');
var OperatorState = require('../../../definition/operator_state');
var uiclassID = require('../../../definition/uiClassID');

var db = require('../../../db/index');
var dbOrder = db.order;
var rdbNO = db.ramdb.no;

function handle(req, res, body, callback) {
    var user = req.user;
    var _user = db.ramdb.oo.get_by_identity(user);
    var isOnDuty = false;
    if(_user){
        isOnDuty = (_user.state == OperatorState.onDuty);
    }

    var dbOrder = db.order;
    var rdbOO = db.ramdb.oo;
    var isAdmin = (user.classID == uiclassID.admin || user.group.classID == uiclassID.adminGroup);

    var limit = body.limit || 5;

    var response = [];
    var _dic = {};

    var add_order = function (order) {
        var _key = format_key(order.region.serverNO, order.region.classID, order.region.id);
        if(!_dic[_key]){
            var _item = undefined;
            var no = rdbNO.get_by_identity(order.region);
            if(no){
                _item = {serverNO: order.region.serverNO, classID: order.region.classID, id: order.region.id, name: no.fullName, type_dic: {}};
            }else{
                _item = {serverNO: order.region.serverNO, classID: order.region.classID, id: order.region.id, name: '未知', type_dic: {}};
            }
            _dic[_key] = _item;
        }

        let _data = _dic[_key];
        if(!_data.type_dic[order.classID]){
            _data.type_dic[order.classID] = 0;
        }
        _data.type_dic[order.classID]++;
    };

    var order_arr = db.ramdb.order.get_all_order();
    if(order_arr && order_arr.length > 0){
        for(var i=order_arr.length-1;i>=0;i--){
            var order = order_arr[i];
            if(!order.region){
                continue;
            }

            if(order.recipient == undefined && order.group == user.group.id && isOnDuty){
                add_order(order);
                continue;
            }
            if(order.state == OrderState.draft){
                if(order.sponsor == user.id){
                    add_order(order);
                    continue;
                }
            }else{
                if(isAdmin || order.recipient == user.id){
                    add_order(order);
                    continue;
                }
            }
        }
    }

    for(let key in _dic){
        let item = _dic[key];
        if(item.type_dic){
            item.list = [];
            for(let _type in item.type_dic){
                let count = item.type_dic[_type];
                item.list.push({type: _type, count: count});
            }
            delete item.type_dic;
        }

        if(response.length > limit){
            break;
        }
        response.push(item);
    }

    callback(null, response);

    // dbOrder.aggregate([
    //     {$match: {state: {$in: [OrderState.unreceived, OrderState.processing]}, region: {$ne: null}}},
    //     {$group: {
    //         _id: {serverNO: '$region.serverNO', classID: '$region.classID', id: '$region.id', type: '$classID'},
    //         count: {$sum: 1}
    //     }},
    //     {$limit: limit}
    // ], function (err, results) {
    //     if(err) return callback(err);


    //     if(results){
    //         for(var i=0;i<results.length;i++){
    //             var item = results[i];

    //             var _id = item._id;
    //             var type = _id.type;
    //             var count = item.count;

    //             var _key = format_key(_id.serverNO, _id.classID, _id.id);
    //             if(!_dic[_key]){
    //                 var _item = undefined;
    //                 var no = rdbNO.get_by_identity(_id);
    //                 if(no){
    //                     _item = {serverNO: _id.serverNO, classID: _id.classID, id: _id.id, name: no.fullName, list: []};
    //                 }else{
    //                     _item = {serverNO: _id.serverNO, classID: _id.classID, id: _id.id, name: '未知', list: []};
    //                 }
    //                 response.push(_item);
    //                 _dic[_key] = _item
    //             }
    //             _dic[_key].list.push({type: type, count: count})
    //         }
    //     }

    //     callback(null, response);
    // });
}

module.exports.cmd = cmd.odr_0x00010013;
module.exports.handle = handle;
module.exports.paramSchema = {
    type: 'object',
    properties: {
        limit: {type: 'integer'}
    }
};