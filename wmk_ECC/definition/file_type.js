/**
 * Created by wangxh on 2017/7/27.
 */
'use strict';

var file_type = {
    none: 0x0,            //无
    backup: 0x1,      //数据库备份文件
    update: 0x2,     //更新文件
    update_web: 0x3  //更新web文件
};

module.exports = file_type;