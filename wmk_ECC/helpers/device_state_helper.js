/**
 * Created by wangxh on 2017/11/25.
 */

'use strict';

var _state_cache = {};

function get_device_state(serverNO, classID, id) {
    if(_state_cache[serverNO] && _state_cache[serverNO][classID]){
        return _state_cache[serverNO][classID][id];
    }
    return undefined;
}

function update_device_online_state(serverNO, classID, id, online) {
    if(!_state_cache[serverNO]){
        _state_cache[serverNO] = {};
    }
    if(!_state_cache[serverNO][classID]){
        _state_cache[serverNO][classID] = {};
    }
    var item = _state_cache[serverNO][classID][id];
    if(item){
        var sc = item.online != online;
        item.online = online;
        return sc;
    }else{
        _state_cache[serverNO][classID][id] = {online: online};
        return true;
    }
}

module.exports.get_device_state = get_device_state;
module.exports.update_device_online_state = update_device_online_state;