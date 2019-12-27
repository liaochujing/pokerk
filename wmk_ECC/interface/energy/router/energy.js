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
var uiclassID = require('../../../definition/uiClassID');
var realTimeProcessor = require('../../../modules/energy/processor/real_time_data_processor');

var db = require('../../../db');
var rdbNO = db.ramdb.no;

router.use('/', function (req, res, next) {
    var arg = url.parse(req.url).query;
    var body = qs.parse(arg);
    req.body = body;
    next();
});

router.get('/pue', function (req, res, next) {
    var id = parseInt(req.body.id);
    var no = rdbNO.get_no_sync(0, 0, id);
    if(!no || !(no.classID >= uiclassID.area && no.classID <= uiclassID.lastArea)){
        return next({status: code.not_found})
    }

    var pue = 0;
    var data = realTimeProcessor.get_area_data_cache(no);
    if(data){
        pue = data.pue || 0
    }

    sendResponse(req, res, null, {pue: pue})
});

router.get('/his_pue', function (req, res, next) {
    var id = parseInt(req.body.id);
    var time = new Date(req.body.time);
    if(!time || isNaN(time.getTime())){
        return next({status: code.param_error, msg: 'time required'})
    }else{
        time = time.format_day()
    }
    var no = rdbNO.get_no_sync(0, 0, id);
    if(!no || !(no.classID >= uiclassID.area && no.classID <= uiclassID.lastArea)){
        return next({status: code.not_found})
    }

    db.datadb.amday.query({serverNO: no.serverNO, classID: no.classID, id: no.id, day: time}, {pue: 1}, function (err, results) {
        if(err) return next(err);

        var pue = 0;
        if(results && results.length > 0){
            pue = results[0].pue || 0
        }

        sendResponse(req, res, null, {pue: pue});
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