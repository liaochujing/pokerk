/**
 * Created by wangxh on 2017/7/19.
 */

'use strict';

var async = require('neo-async');

function parallel(array, cbFinal) {
    async.parallel(array, cbFinal);
}

function series(array, cbFinal) {
    async.series(array, cbFinal)
}

function each_series(array, cbItem, cbFinal) {
    if(!array){
        return cbFinal();
    }
    async.eachSeries(array, cbItem, cbFinal)
}

function each(array, cbItem, cbFinal) {
    if(!array){
        return cbFinal();
    }
    async.each(array, cbItem, cbFinal);
}

function each_limit(array, cbItem, cbFinal, worker) {
    if(!array){
        return cbFinal();
    }
    if(!worker){
        worker = 50
    }
    async.eachLimit(array, worker, cbItem, cbFinal);
}

function retry(option, cbItem, cbFinal) {
    async.retry(option, cbItem, cbFinal);
}


module.exports.parallel = parallel;
module.exports.series = series;
module.exports.each = each;
module.exports.each_limit = each_limit;
module.exports.each_series = each_series;
module.exports.retry = retry;