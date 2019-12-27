/**
 * Created by wangxh on 2017/3/28.
 */

'use strict';

var http = require('http');

var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var logger = require('../util/log_manager').logger;

var app = express();

var sessionDBConfig = require('../config/db_config').main;

var mongoose = require('mongoose');
var conn = mongoose.createConnection(sessionDBConfig.url);

app.use(session({
    store:  new MongoStore({mongooseConnection: conn}),
    secret: 'mon',
    cookie: {maxAge: 60 * 60 * 1000},//过期时间
    resave: false,
    rolling : true,
    saveUninitialized: true
}));
app.use(bodyParser.json({limit: '10000kb'}));
app.use(bodyParser.urlencoded({limit: '10000kb', extended: true}));

function start(param, done) {
    //操作日志
    app.use(function (req, res, next) {
        var cmd = '';
        if(req.headers){
            cmd = req.headers['cmd'];
        }
        req._startTime = Date.now();

        var path = req.path;
        var showBody = true;
        if(svrType == 0x400 && cmd == '0x00000014'){
            showBody = false;
        }
        logger.info('recv req[path: %s, cmd: %s, body: %j]', path, cmd, showBody ? req.body : '');

        next();
    });

    app.get('/', function (req, res, next) {
        res.send('DCIM')
    });

    //根据传入的路由决定实际路由
    var router = require('./' + param.router);
    app.use(router);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send({message: 'server internal error'});
        logger.error(err);
    });

    var port = param.port || 3000;

    var server = http.createServer(app);
    server.on('error', function (err) {
        logger.error(err);
    });
    server.on('listening', function () {
        logger.info('listening on: ', port)
    });
    server.listen(port);

    done();
}

module.exports.start = start;