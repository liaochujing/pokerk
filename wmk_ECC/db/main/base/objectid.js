/**
 * Created by wangxh on 2017/10/11.
 */

'use strict';

module.exports = function (conn) {
    var collection = conn.collection('objectids');

    collection.gen_object_id = function (key, callback, count) {
        if(!count){
            count = 1;
        }
        collection.findAndModify({_id: key}, [], {$inc:{id: count}},{new:true,upsert:true},function(err, result){
            if(err) return callback(err);
            var id = result.value.id;
            if(count !== 1){
                id = result.value.id - count + 1;
            }
            callback(undefined, id);
        });
    };

    // var _dic = {};
    // collection.gen_object_id_ex = function (key, callback, count) {
    //     if(!count){
    //         count = 1;
    //     }
    //
    //     var _from = 0;
    //     var _to = 0;
    //     if(_dic[key]){
    //         var _item = _dic[key];
    //         _from = _item.from;
    //         _to = _item.to;
    //     }else{
    //         _dic[key] = {from: 0, to: 0};
    //     }
    //
    //     var _id = _from + count;
    //     if(_id <= _to){
    //         _item.from = _id;
    //         callback(null, _from);//已申请id充足
    //         return;
    //     }
    //
    //     //已申请id不足时
    //     var len = count;
    //     if(len < 10){//至少100
    //         len = 10;
    //     }
    //     collection.findAndModify({_id: key}, [], {$inc:{id: len}},{new:true,upsert:true},function(err, result){
    //         if(err) return callback(err);
    //         var id = result.value.id;
    //
    //         if(_dic[key].from == 0){
    //             _dic[key].from = id - len + 1;
    //         }else{
    //             _dic[key].from+=count;
    //         }
    //         _dic[key].to = id;
    //
    //         callback(undefined, id);
    //     });
    // };

    collection.update_object_id = function (key, id, callback) {
        collection.update({_id: key}, {$set: {id: id}},{new:true,upsert:true}, callback);
    };

    collection.ensure_object_id = function (key, id, callback) {
        collection.find({_id: key}, {id: 1}).toArray(function (err, results) {
            if(err) {
                callback(err);
                return;
            }
            var preid = 0;
            if(results && results.length > 0){
                preid = results[0].id;
            }
            if(preid < id){
                collection.update({_id: key}, {$set: {id: id}},{new:true,upsert:true}, callback);
            }else{
                callback();
            }
        });
    };

    collection.find_object_id = function (param, fields, callback) {
        collection.find(param, fields).toArray(callback);
    };

    return collection;
};