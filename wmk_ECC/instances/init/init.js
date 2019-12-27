/**
 * Created by wangxh on 2017/9/27.
 */

'use strict';

var serverType = require('../../definition/service_type');
var param = {};

global.svrType = serverType.none;
global.defaultServerNO = 0;

var app = require('./app');
app.run(param);