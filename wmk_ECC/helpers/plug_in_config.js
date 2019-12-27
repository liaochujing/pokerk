/**
 * Created by wangxh on 2019/3/19.
 */

'use strict';

var fs = require('fs');
var logger = require('../util/log_manager').logger;

var plug_ins = undefined;
try{
    if(fs.existsSync('./config/plug_in.js')){
        plug_ins = require('../config/plug_in');
    }
}catch(err){
    logger.error({msg: 'load plug in failed', err: err});
}

if(plug_ins == undefined){
    plug_ins = {};
}

module.exports = plug_ins;