/**
 * Created by wangxh on 2017/7/14.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var UglifyJS = require('uglify-js');

var version = require('./config/version');
var async = require('async');

var minify = false;//是否混淆代码
var source_path = './';
var _target_path = '../Release/' + version + '/wmk_ECC';

if(fs.existsSync(_target_path)){
    rmdir(_target_path);
}

function archive_release() {
    var output = fs.createWriteStream('../Release/' + version + '/wmk_ECC_' + version +'.tar.gz');
    var archive = archiver('tar', {gzip: true, gzipOptions: {level: 9}});

    archive.pipe(output);
    archive.directory(_target_path, 'wmk_ECC/');

    archive.finalize();

    console.log('release path: %s', path.resolve(path.dirname(_target_path)));
}

function rmdir(dir) {
    function iterator(url,dirs){
        var stat = fs.statSync(url);
        if(stat.isDirectory()){
            dirs.unshift(url);//收集目录
            inner(url,dirs);
        }else if(stat.isFile()){
            fs.unlinkSync(url);//直接删除文件
        }
    }
    function inner(path,dirs){
        var arr = fs.readdirSync(path);
        for(var i = 0, el ; el = arr[i++];){
            iterator(path+"/"+el,dirs);
        }
    }

    var dirs = [];
    try{
        iterator(dir,dirs);
        for(var i = 0, el ; el = dirs[i++];){
            fs.rmdirSync(el);//一次性删除所有收集到的目录
        }
    }catch(e){//如果文件或目录本来就不存在，fs.statSync会报错，不过我们还是当成没有异常发生
        console.log(e);
    }
}

function mkdir(dirpath, callback) {
    fs.exists(dirpath, function(exists) {
        if(exists) {
            callback(dirpath);
        } else {
            mkdir(path.dirname(dirpath), function(){
                fs.mkdir(dirpath, callback);
            });
        }
    });
}

function travel(dir, callback, finish) {
    var files = fs.readdirSync(dir);
    async.eachSeries(files, function (file, cbNext) {
        var pathname = path.join(dir, file);
        fs.stat(pathname, function (err, stats) {
            if (stats.isDirectory()) {
                travel(pathname, callback, function () {
                    cbNext();
                });
            } else {
                callback(dir, file, function () {
                    cbNext();
                });
            }
        });
    }, function () {
        finish();
    })
}

var copy = undefined;
if(minify){
    var options = { toplevel: true };
    copy = function(src, dst, callback) {
        var ext = path.extname(src);
        if(ext == '.js'){
            var result = UglifyJS.minify(src, options);
            if(result.error){
                console.log(result.error);
                return;
            }
            fs.writeFile(dst, result.code, 'utf-8', function (err) {
                if(err){
                    console.log(err);
                    return;
                }
                callback();
            });
        }else{
            var stream = fs.createReadStream(src);
            stream.on('end', function () {
                callback();
            });
            stream.pipe(fs.createWriteStream(dst));
        }
    }
}else{
    copy = function(src, dst, callback) {
        var stream = fs.createReadStream(src);
        stream.on('end', function () {
            callback();
        });
        stream.pipe(fs.createWriteStream(dst));
    }
}

function release(done) {
    var target_path = _target_path;

    var folders = ['.idea', 'logs', 'data', 'cache', 'config', 'export', 'test'];
    var files = ['release.js'];

    folders.push('export.PC');

    function copy_version_file(callback) {
        mkdir(path.join(target_path, 'config'), function () {
            var source = path.join(source_path, 'config', 'version.js');
            var configFile = path.join(target_path, 'config', 'version.js');
            fs.exists(configFile, function(exists) {
                if(!exists){
                    console.log('=> copy version file');
                    copy(source, configFile, callback);
                }else{
                    callback();
                }
            });
        })
    }

    function copy_update_file(callback) {
        var config_path = '../Release/update';
        travel(config_path, function (dir, filename, cb) {
            var rpath = path.join(dir, filename);
            var dstPath = '../Release/' + version + '/wmk_ECC' + dir.substring(17);
            var dstFileName = path.join(dstPath, filename);
            mkdir(dstPath, function () {
                count++;
                copy(rpath, dstFileName, cb);
            });
        }, function () {
            callback();
        })
    }

    console.log('-- start --');
    var count = 0;
    travel(source_path, function (dir, filename, cb) {

        var folder = dir;
        var index = dir.indexOf('\\');
        if(index >= 0){
            folder = dir.substring(0, index);
        }

        if(folders.indexOf(folder) >= 0){
            return cb();
        }
        var rpath = path.join(dir, filename);
        if(files.indexOf(rpath) >= 0){
            return cb();
        }

        if(dir == 'export.A9'){
            dir = 'export'
        }
        var srcPath = rpath;
        var dstPath = path.join(target_path, dir);
        var dstFileName = path.join(dstPath, filename);

        mkdir(dstPath, function () {
            count++;
            console.log('copy: ' + rpath + ', =>: ' + dstFileName);
            copy(rpath, dstFileName, cb);
        });
    }, function () {
        copy_version_file(function () {
            console.log('=> copy files count: ', count);
            console.log('-- start copy update file --');
            copy_update_file(function () {
                console.log('-- end --');
                done();
            })
        })
    });
}

console.time('xx');
release(function () {
    console.timeEnd('xx');

    archive_release();

    console.log('release time: %s', new Date().toLocaleString());
    console.log('---------- %s ----------', version);
});