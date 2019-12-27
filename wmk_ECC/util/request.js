/**
 * Created by wangxh on 2018/1/3.
 */

'use strict';

var http = require('http');
var https = require('https');

function _post(option, data, callback) {
    var options = {
        host: option.host,
        port: option.port,
        path: option.url,
        method: 'POST',
        headers: option.headers || {'Content-Type': 'application/json; charset=utf-8'}
    };

    var protocel = http;
    if(option.security){
        protocel = https;
    }

    var req = protocel.request(options, function(res) {
        var content = '';
        res.on('data', function(chunk) {
            content+= chunk;
        });
        res.on('end', function() {
            var result = JSON.parse(content);
            res.body = result;
            callback(null, res);
        });
    });
    req.on('error', function(err) {
        callback(err);
    });
    req.setTimeout((option.timeout || 5) * 1000, function () {
        if (req.res) {
            req.res.emit('abort');
        }
        req.abort()
    });
    req.write(JSON.stringify(data));
    req.end();
}

function _get(option, callback) {
    var options = {
        host: option.host,
        port: option.port,
        path: option.url,
        method: 'GET',
        headers: option.headers || {'Content-Type': 'application/json; charset=utf-8'}
    };

    var protocel = http;
    if(option.security){
        protocel = https;
    }

    var req = protocel.request(options, function(res) {
        var content = '';
        res.on('data', function(chunk) {
            content+= chunk;
        });
        res.on('end', function() {
            var result = JSON.parse(content);
            res.body = result;
            callback(null, res);
        });
    });
    req.on('error', function(err) {
        callback(err);
    });
    req.setTimeout((option.timeout || 5) * 1000, function () {
        if (req.res) {
            req.res.emit('abort');
        }
        req.abort()
    });
    req.end();
}

function post(option, data, callback) {
    _post(option, data, callback)
}

function get(option, data, callback) {
    var _url = option.url;
    if(data){
        var _param = '';
        for(var key in data){
            if(_param){
                _param += '&'
            }
            _param += ('' + key + '=' + data[key])
        }
        if(_param){
            _url = _url + '?' + _param;
        }
    }
    option.url = _url;
    _get(option, callback)
}

module.exports = {
    post: post,
    get: get
};