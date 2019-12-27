/**
 * Created by wangxh on 2017/11/27.
 */

'use strict';

global.format_value = function (value, len) {
    if(value){
        let _v = 100;
        if(len){
            _v = Math.pow(10, len)
        }
        return Math.round(value * _v) / _v;
    }else{
        return value;
    }
};

global.format_key = function () {
    var res = '' + arguments[0];
    var len = arguments.length;
    for(var i=1;i<len;i++){
        res+=('_' + arguments[i]);
    }
    return res
};

global.copy_object = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};

global.IsNullOrEmpty = function (value) {
    if(value == undefined || value === ''){
        return true;
    }else{
        return false;
    }
};

global.IsNull = function () {
    if(GetValue.apply(arguments)){
        return false;
    }
    return true;
};

global.GetValue = function () {
    var self = arguments[0];
    switch(arguments.length){
        case 2:
            return self[arguments[1]];
        case 3:
            var p1 = arguments[1];
            var p2 = arguments[2];
            if(self[p1]){
                return self[p1][p2]
            }else{
                return undefined;
            }
        case 4:
            var p1 = arguments[1];
            var p2 = arguments[2];
            var p3 = arguments[3];
            if(self[p1] && self[p1][p2]){
                return self[p1][p2][p3]
            }else{
                return undefined;
            }
        default:
            var _ = self;
            for(var i=1;i<arguments.length;i++){
                var key = arguments[i];
                if(_[key]){
                    _ = _[key];
                }else{
                    return undefined;
                }
            }
            return _;
    }
};

global.SetValue = function () {
    var self = arguments[0];
    var value = arguments[arguments.length - 1];
    switch(arguments.length){
        case 3:
            self[arguments[1]] = value;
            break;
        case 4:
            var p1 = arguments[1];
            var p2 = arguments[2];
            if(!self[p1]){
                self[p1] = {};
            }
            self[p1][p2] = value;
            break;
        case 5:
            var p1 = arguments[1];
            var p2 = arguments[2];
            var p3 = arguments[3];
            if(!self[p1]){
                self[p1] = {};
            }
            if(!self[p1][p2]){
                self[p1][p2] = {};
            }
            self[p1][p2][p3] = value;
            break;
        default:
            var _o = self;
            for(var i=1;i<arguments.length - 2;i++){
                var key = arguments[i];
                if(!_o[key]){

                    _o[key] = {};
                    _o = _o[key];
                }
            }
            _o[arguments[arguments.length - 2]] = value;
    }
};