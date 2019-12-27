/**
 * Created by wangxh on 2018/11/28.
 */

'use strict';

var url = require('url');
var qs = require('querystring');
var express = require('express');
var router = express.Router();

var code = require('../code');
var logger = require('../../../util/log_manager').logger;

var db = require('../../../db');
var dbHisAlarm = db.datadb.hisalarm;
var dbAlarm = db.alarm;

router.use('/', function (req, res, next) {
    var arg = url.parse(req.url).query;
    var body = qs.parse(arg);
    req.body = body;
    next();
});

router.get('/alarm', function (req, res, next) {
    var startTime = new Date(req.body.from);
    var endTime = new Date(req.body.to);
    if(isNaN(startTime.getTime()) || isNaN(endTime.getTime())){
        return next({status: code.other, msg: 'time invalid'})
    }
    var interval = endTime.getTime() - startTime.getTime();
    if(interval < 0){
        return next({status: code.other, msg: 'time error'})
    }
    var page_index = parseInt(req.body.page_index) || 1;
    var page_size = parseInt(req.body.page_size) || 500;
    if(page_index <= 0){
        page_index = 1;
    }
    if(page_size < 0){
        page_size = 500
    }
    if(page_size > 1000){
        page_size = 1000;
    }
    var _skip = page_size * (page_index - 1);
    if(_skip < 0){
        _skip = 0;
    }

    dbAlarm.aggregate([{$sort: {startTime: 1}}, {$match: {startTime: {$gte: startTime, $lt: endTime}}}, {$skip: _skip}, {$limit: page_size}, {$project: {
        _id: 0,
        sNO: '$serverNO',
        type: '$classID',
        id: "$id",
        desc: '$desc',
        level: '$level',
        st: '$startTime',
        ct: '$confirmed.time',      //确认时间
        et: '$endTime',             //结束时间
        ft: '$force.time'          //强制结束时间
    }}], function (err, data) {
        if(err) return next({status: code.unknown});
        sendResponse(req, res, null, data);
    });
});

router.get('/his_alarm', function (req, res, next) {
    var startTime = new Date(req.body.from);
    var endTime = new Date(req.body.to);
    if(isNaN(startTime.getTime()) || isNaN(endTime.getTime())){
        return next({status: code.other, msg: 'time invalid'})
    }
    var interval = endTime.getTime() - startTime.getTime();
    if(interval < 0){
        return next({status: code.other, msg: 'time error'})
    }
    var page_index = parseInt(req.body.page_index) || 1;
    var page_size = parseInt(req.body.page_size) || 500;
    if(page_index <= 0){
        page_index = 1;
    }
    if(page_size < 0){
        page_size = 500
    }
    if(page_size > 1000){
        page_size = 1000;
    }
    var _skip = page_size * (page_index - 1);
    if(_skip < 0){
        _skip = 0;
    }

    dbHisAlarm.aggregate([{$sort: {startTime: 1}}, {$match: {startTime: {$gte: startTime, $lt: endTime}}}, {$skip: _skip}, {$limit: page_size}, {$project: {
        _id: 0,
        sNO: '$serverNO',
        type: '$classID',
        id: "$id",
        desc: '$desc',
        level: '$level',
        st: '$startTime',
        ct: '$confirmed.time',      //确认时间
        et: '$endTime',             //结束时间
        ft: '$force.time'          //强制结束时间
    }}], function (err, data) {
        if(err) return next({status: code.unknown});
        sendResponse(req, res, null, data);
    });
});

router.use('/', function (err, req, res, next) {
    sendResponse(req, res, err);
});

var sendResponse = function (req, res, err, result) {
    var cmd = '';
    var status = undefined;
    var msg = undefined;
    var message = undefined;
    if(req.headers){
        cmd = req.headers['cmd'];
    }
    if(err){
        if(err.status == undefined){
            status = code.unknown;
        }else{
            status = err.status
        }
        msg = err.msg || code.getText(status);
        message = err.message;

        logger.warn('resp req[cmd: %s, code: %s, msg: %s], time: %d ms', cmd, status, msg, Date.now() - req._startTime);
    }else{
        status = code.ok;
        msg = code.getText(status);
        logger.info('resp req[cmd: %s, code: %s], time: %d ms', cmd, status, Date.now() - req._startTime);
    }

    var response = {
        code: status,
        msg: msg,
        message: message,
        data: result
    };

    res.send(response);
};

module.exports = router;