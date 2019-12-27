/**
 * Created by wangxh on 2017/7/27.
 */
'use strict';

var alarm_level = {
    event: 0x0,      // 事件
    notice: 0x1,      // 提示告警
    normal: 0x2,     // 一般告警
    important: 0x3, // 重要告警
    urgent: 0x4,     // 紧急告警

    getText: function (level){
        switch(level){
            case this.event:
                return '事件';
            case this.notice:
                return '提示';
            case this.normal:
                return '一般';
            case this.important:
                return '重要';
            case this.urgent:
                return '紧急';
        }
    }
};

module.exports = alarm_level;