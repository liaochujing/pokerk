/**
 * Created by wangxh on 2019/2/26.
 */

'use strict';

var ah = require('../../../util/array_helper');
var logger = require('../../../util/log_manager').logger;
var notification = require('../../../helpers/notification_helper');

var uiclassID = require('../../../definition/uiClassID');
var dataHelper = require('../../../protocol/central/server_manager');
var DataMessage = require('../../../protocol/definition/data_message');
var CentralCMD = require('../../../protocol/central/cmd');
var interfaceHelper = require('../../../protocol/central/interface_helper');
var sys_cfg_key = require('../../../modules/manager/definition/sys_config_key');

var db = require('../../../db');
var dbDP = db.dp;
var dbLCL = db.datadb.lcl;
var rdbCNOR = db.ramdb.cnor;
var rdbCFG = db.ramdb.cfg;

var controller_list = [];
const default_max_get_pm_retry_times = 5;

// var link = {
//     id: 0,	//ID
//     name: '',//名称
//     type: 1,//类型(1：pid控制)，固定填1
//     option: {
//         Dt: 0,//调节周期，单位（秒）
//         Kp: 0,//比例因素
//         Ki: 0,//积分因素
//         Kd: 0,//微分因素
//         max_out: 0,//最大输出
//         min_out: 0,//最小输出
//         max_get_pm_retry_times: 0,//最大重试次数（获取PM值）
//         control_level: 0,//控制等级
//         target: [{
//             point: {serverNO: 0, classID: 0, id: 0, pointIndex: 0},//实际值（点）
//             key: ''//0.3或0.5
//         }],
//         set_point: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}],
//         control_time_out: 0,              //控制超时时间
//         control_retry_times: 0           //控制重试次数
//     },
//     enabled: 1	//是否启用
// };

function constrain_output(amt, max, min) {
    if(amt < min){
        return min;
    }
    if(amt > max){
        return max;
    }
    return Math.round(amt);
}

function parse_points(points, callback) {
    let _points = [];
    for(let i=0;i<points.length;i++){
        let _p = points[i];
        if(_p.lock == 1){
            //锁住不参与控制
            continue;
        }
        _points.push({deviceServerNO: _p.serverNO, deviceClassID: _p.classID, deviceID: _p.id, pointIndex: _p.pointIndex});
    }
    dbDP.find_device_point({$or: _points}, {deviceServerNO: 1, deviceClassID: 1, deviceID: 1, pointIndex: 1, binding: 1}, function (err, result) {
        if(err) return callback({msg: 'link control init failed', err: err});

        let _list = [];
        if(result && result.length > 0){
            let _dic = {};
            for(let i = 0;i<result.length;i++){
                let _p = result[i];
                if(_p.binding && _p.binding.id){
                    var collector = undefined;
                    if(_p.binding.classID == uiclassID.collector){
                        collector = _p.binding;
                    }else{
                        collector = rdbCNOR.get_parent_identity(_p.binding.serverNO, _p.binding.classID, _p.binding.id, uiclassID.collector);
                    }
                    if(collector){
                        if(!_dic[collector.id]){
                            _dic[collector.id] = {
                                serverNO: collector.serverNO,
                                classID: collector.classID,
                                id: collector.id,
                                points: []
                            };
                            _list.push(_dic[collector.id]);
                        }
                        _dic[collector.id].points.push(_p.binding);
                    }
                }
            }
        }

        if(_list.length > 0){
            callback(null, _list);
        }else{
            callback({msg: 'link control init failed', err: 'set point not found'});
        }
    });
}

function pid_link_controller_controller(link) {
    logger.mark('link controller: %j', link);
    this.link = link;
    var _option = link.option;

    this.link_id = link.id;
    this.enabled = link.enabled;

    this.Dt = _option.Dt;                           //调节周期，单位（秒）
    this.Kp = _option.Kp;                           //比例
    this.Ki = _option.Ki;                           //积分
    this.Kd = _option.Kd;                           //微分

    this.max_out = _option.max_out;                 //最大输出
    this.min_out = _option.min_out;                 //最小输出
    this.max_get_pm_retry_times = _option.max_get_pm_retry_times || default_max_get_pm_retry_times; //最大重试次数（获取PM值）,连续获取出错输出默认值.

    this.control_level = _option.control_level;//控制等级
    this.target = _option.target;   //实际值（点）
    this.set_point = _option.set_point;           //控制点

    this.control_time_out = _option.control_time_out * 1000;       //控制超时时间(秒)
    this.control_retry_times = _option.control_retry_times || 1; //控制重试次数
    this.control_retry_interval = (_option.control_retry_interval * 1000) || 1000; //控制重试间隔

    this.output = 0;        //输出值
    this.get_pm_failed_times = 0; //获取PM值失败次数
    this._max_out_times = 0;
    this._min_out_times = 0;

    this.min_speed = 850; //最小转速标准值
}

pid_link_controller_controller.prototype.run = function () {
    let _config = rdbCFG.get_system_config(sys_cfg_key.link_control_level);
    if(_config == undefined){
        return;
    }

    let _default_output = undefined;
    let _target_map = {};
    for(let i=0;i<_config.length;i++){
        if(_config[i].level == this.control_level){
            let _tmp = _config[i];
            for(let j=0;j<_tmp.pm_list.length;j++){
                _target_map[_tmp.pm_list[j].key] = _tmp.pm_list[j];
            }
            _default_output = _tmp.default_output;
            break;
        }
    }
    let self = this;
    logger.mark('link: %d, target: %j', self.link_id, _default_output);

    let _points = [];
    for(let i=0;i<self.target.length;i++){
        let points = self.target[i].points;
        if(points != undefined){
            for(let j=0;j<points.length;j++){
                _points.push(points[j]);
            }
        }
    }

    let a_points = [];//a组
    let b_points = [];//b组
    let c_points = [];//c组

    //风机分组
    for(let i=0;i<self.set_point.length;i++){
        let _p = self.set_point[i];
        if(_p.lock == 1){
            //锁住不参与控制
            continue;
        }
        if(_p.group == 1){
            b_points.push(_p);
        }else if(_p.group == 2){
            c_points.push(_p);
        }else{
            a_points.push(_p);
        }
        _points.push(_p);
    }

    interfaceHelper.get_point_value_list(_points, function (err, result) {
        if(err) return logger.error({msg: 'control failed, get current value failed', err: err});
        if(self.destoryed){//已经销毁
            return;
        }

        //#region 控制分组

        let is_need_pid = false;//是否需要pid控制
        let control_points = [];//需要控制的点
        let out_speed = 0;//控制的转速

        //当最小转速850时，粒子数值小于对应级别的下限值则应停止A组风机，然后继续监测如果粒子数值大于粒子下限值，小于粒子上限值则不动作
        //如果粒子数值大于上限值则启动A组风机，如果洁净度依然在要求范围内并且粒子数值小于对应级别的下限值则继续停止B组风机
        //如果粒子数值大于粒子下限值，小于粒子上限值则不动作，如果洁净度依然在要求范围内并且粒子数值小于对应级别的下限值则继续停止C组风机，
        //如果粒子数值大于粒子下限值，小于粒子上限值则不动作，如果洁净度依然在要求范围内并且粒子数值小于对应级别的下限值则不做调节。
        //依次类推如果粒子数值大于上限值则启动C组风机，如果还是大于上限制则启动B组，直到全部启动

        let _clean_type = 0;//清洁度 0 低于下限 1 下限上限之间 2 高于上限

        for(let i=0;i<self.target.length;i++){
            let _item = self.target[i];
            let pv = undefined;
            let _temp_clean_type = 0;
            if(_item.points != undefined){
                for(let j=0;j<_item.points.length;j++){
                    let _pv = GetValue(result, _item.points[j].serverNO, _item.points[j].id, _item.points[j].pointIndex);
                    if(_pv != undefined && (pv == undefined || _pv > pv)){
                        pv = _pv;
                    }
                }
                if(pv != undefined){
                    let _target = _target_map[_item.key];
                    if(_target == undefined){
                        continue;
                    }
                    if(pv < _target.min){
                        //小于下限
                        _temp_clean_type = 0;
                    }else if(pv > _target.max){
                        //大于上限
                        _temp_clean_type = 2;
                    }else{
                        //之间
                        _temp_clean_type = 1;
                    }
                }
            }

            _clean_type = _clean_type > _temp_clean_type ? _clean_type: _temp_clean_type;//清洁度取最大值
        }

        var is_a_stop = true;//a停止
        var is_a_min = true;//a都小于最小转速
        var is_b_stop = true;//b停止
        var is_b_min = true;//b都小于最小转速
        var is_c_stop = true;//c停止
        var is_c_min = true;//c都小于最小转速

        if(a_points.length > 0){
            for(let i=0;i<a_points.length;i++){
                let _item_p = a_points[i];
                let _pv = GetValue(result, _item_p.serverNO, _item_p.id, _item_p.pointIndex);
                if(_pv != undefined){
                    if(_pv > 0){
                        is_a_stop = false;
                    }
                    if(_pv > self.min_speed){
                        is_a_min = false;
                    }
                }
            }
        }
        if(b_points.length > 0){
            for(let i=0;i<b_points.length;i++){
                let _item_p = b_points[i];
                let _pv = GetValue(result, _item_p.serverNO, _item_p.id, _item_p.pointIndex);
                if(_pv != undefined){
                    if(_pv > 0){
                        is_b_stop = false;
                    }
                    if(_pv > self.min_speed){
                        is_b_min = false;
                    }
                }
            }
        }
        if(c_points.length > 0){
            for(let i=0;i<c_points.length;i++){
                let _item_p = c_points[i];
                let _pv = GetValue(result, _item_p.serverNO, _item_p.id, _item_p.pointIndex);
                if(_pv != undefined){
                    if(_pv > 0){
                        is_c_stop = false;
                    }
                    if(_pv > self.min_speed){
                        is_c_min = false;
                    }
                }
            }
        }

        logger.mark('is_a_stop: %s, is_a_min, %s, is_b_stop: %s, is_b_min: %s, is_c_stop: %s, is_c_min: %s, clean_type: %d', 
            is_a_stop, is_a_min, is_b_stop, is_b_min, is_c_stop, is_c_min, _clean_type);

        if(_clean_type == 0){
            //低于下限
            if(!is_a_stop && is_a_min){
                //a未停止且小于转速,停止a
                control_points = control_points.concat(a_points);
                out_speed = 0;//0停止
            }else if(is_a_stop && !is_b_stop && is_b_min){
                //a停止,b未停止且小于转速,停止b
                control_points = control_points.concat(b_points);
                out_speed = 0;//0停止
            }else if(is_a_stop && is_b_stop && !is_c_stop && is_c_min){
                //ab停止,c未停止且小于转速,停止c
                control_points = control_points.concat(c_points);
                out_speed = 0;//0停止
            }
        }else if(_clean_type == 1){
            //上下之间
        }else if(_clean_type == 2){
            //高于上限
            if(is_c_stop && c_points.length > 0){
                //c停止,启动c
                control_points = control_points.concat(c_points);
                out_speed = self.min_speed;
            }else if(is_b_stop && b_points.length > 0){
                //b停止,启动b
                control_points = control_points.concat(b_points);
                out_speed = self.min_speed;
            }else if(is_a_stop && a_points.length > 0){
                //a停止,启动a
                control_points = control_points.concat(a_points);
                out_speed = self.min_speed;
            }else{
                //进行pid计算
                is_need_pid = true;
            }
        }
        
        if(control_points.length > 0){
            //控制点值
            parse_points(control_points, function(err, result_points){
                if(err) {
                    logger.error(err);
                    return;
                }

                self.control(out_speed, result_points);
            })
        }

        //#endregion

        //#region pid控制转速

        if(!is_need_pid){
            return;
        }

        let _failed = false;
        let _gt = 0;
        let _eq = 0;
        let _lt = 0;

        let _increment = 0;
        let _increment1 = 0;
        let _increment2 = 0;

        for(let i=0;i<self.target.length;i++){
            let _item = self.target[i];
            let pv = undefined;
            if(_item.points != undefined){
                for(let j=0;j<_item.points.length;j++){
                    let _pv = GetValue(result, _item.points[j].serverNO, _item.points[j].id, _item.points[j].pointIndex);
                    if(_pv != undefined && (pv == undefined || _pv > pv)){
                        pv = _pv
                    }
                }
            }
            if(pv != undefined){
                _item.actual_value = pv;
                let _target = _target_map[_item.key];
                if(_target == undefined){
                    continue;
                }

                if(_item.actual_value < _target.min){
                    _item.err = _item.actual_value - _target.min;
                }else if(_item.actual_value > _target.max){
                    _item.err = _item.actual_value - _target.max;
                }else{
                    _item.err = 0;
                }

                let p_err = _item.err - (_item.pre_err || 0);
                let i_err = _item.err;
                let d_err = _item.err - 2 * (_item.pre_err || 0) + (_item.pree_err || 0);

                _item.pree_err = _item.pre_err;
                _item.pre_err = _item.err;

                let increment = self.Kp * p_err + self.Ki * i_err + self.Kd * d_err;
                logger.mark('link: %d, key: %s, actual value: %d, min: %d, max: %d, increment: %d', self.link_id, _item.key, _item.actual_value, _target.min, _target.max, increment);
                if(_item.actual_value < _target.min){
                    _lt++;
                    if(_increment1 == undefined || Math.abs(increment) > Math.abs(_increment1)){//取未达到条件中增长最大的。
                        if(_increment1 == undefined || increment * _increment1 >= 0 || increment > _increment1){//符号相同，否则取较大值
                            _increment1 = increment;
                        }
                    }
                    if(_increment2 == undefined || Math.abs(increment) > Math.abs(_increment2)){//取达到条件中增长最大的。
                        if(_increment2 == undefined || increment * _increment2 >= 0 || increment > _increment2){//符号相同，否则取较大值
                            _increment2 = increment;
                        }
                    }
                }else if(_item.actual_value > _target.max){
                    _gt++;
                    if(_increment1 == undefined || Math.abs(increment) > Math.abs(_increment1)){//取未达到条件中增长最大的。
                        if(_increment1 == undefined || increment * _increment1 >= 0 || increment > _increment1){//符号相同，否则取较大值
                            _increment1 = increment;
                        }
                    }
                }else{
                    _eq++;
                }
                logger.mark('link: %d, key: %s, err: %d, p_err: %d, i_err: %d, d_err: %d', self.link_id, _item.key, _item.err, p_err, i_err, d_err);
                logger.mark('link: %d, _increment1, %d, _increment2: %d', self.link_id, _increment1, _increment2)
            }else{
                _item.actual_value = undefined;
                _item.err = 0;
                _item.p_err = 0;
                _item.i_err = 0;
                _item.d_err = 0;
                _failed = true;
            }
        }

        if(_failed){
            self.get_pm_failed_times++;
            dbLCL.insert_link_control_log(self.link_id, '获取当前PM值失败', {target: self.target}, new Date());
            logger.warn('link: %d, get current pm failed, target: %j', self.link_id, self.target);
            if(self.get_pm_failed_times == self.max_get_pm_retry_times){//连续取值失败
                self.control(_default_output);
            }
            return;
        }else{
            self.get_pm_failed_times = 0;
        }

        let _total = self.target.length;
        if(_eq + _lt >= _total && _eq > 0){//所有目标值在误差范围内，或至少有一个值在误差范围内，其他值小于预设值 -- 防止永远达不到平衡状态 --
            if(!self._finished){
                self._finished = true;
                self._max_out_times = 0;
                self._min_out_times = 0;
                dbLCL.insert_link_control_log(self.link_id, '控制完成', {target: self.target}, new Date());
                logger.warn('link: %d control finished, target: %j', self.link_id, self.target)
            }
            self._control_time_out = false;
            self._begin_time = undefined;
            return;
        }else{
            if(_lt == _total){
                _increment = _increment2 || 0;
            }else{
                _increment = _increment1 || 0;
            }
            self._finished = false;
        }

        //持续在最大值状态，控制超时
        if(self.output >= self.max_out){
            let now = Date.now();
            if(self._begin_time == undefined){
                self._begin_time = now;
            }else if(self._begin_time > now){
                self._begin_time = now;
            }

            if(now - self._begin_time > self.control_time_out){
                if(!self._control_time_out){
                    self._control_time_out = true;
                    dbLCL.insert_link_control_log(self.link_id, '控制超时', {target: self.target, begin_time: self._begin_time, current_time: now}, new Date());
                    logger.warn('link: %d control time out', self.link_id);
                }
            }
        }else{
            self._control_time_out = false;
            self._begin_time = undefined;
        }

        let _output = constrain_output(self.output + _increment, self.max_out, self.min_out);
        logger.mark('link: %d, increment: %d, output: %d', _increment, _output);

        if(_output == self.max_out){
            if(self._max_out_times > self.control_retry_times){
                logger.mark('link: %d, control max output out of times', self.link_id);
                return;
            }else{
                self._max_out_times++;
            }
            self._min_out_times = 0;
        }else if(_output == self.min_out){
            if(self._min_out_times > self.control_retry_times){
                logger.mark('link: %d, control min output out of times', self.link_id);
                return;
            }else{
                self._min_out_times++;
            }
            self._max_out_times = 0;
        }else{
            self._max_out_times = 0;
            self._max_out_times = 0;
        }
        self.control(_output);

        //#endregion

    }, 90000);//90s有值
};

pid_link_controller_controller.prototype.control = function (output, _set_points) {
    let self = this;
    self.output = output;
    logger.mark('link: %d, target: %j, output: %d', self.link_id, self.target, self.output);
    let retry_times = self.control_retry_times;
    let retry_interval = self.control_retry_interval;

    let hasError = false;
    let hasSuccess = false;
    let response = [];

    let set_points = [];//要设置的点
    if(_set_points != null){
        set_points = _set_points;
    }else{
        set_points = self._set_points;
    }

    if(set_points.length > 0){
        ah.each(set_points, function (item, cbNext) {
            let points = [];
            for(let i=0;i<item.points.length;i++){
                let _p = item.points[i];
                points.push({serverNO: _p.serverNO, classID: _p.classID, id: _p.id, pointIndex: _p.pointIndex, pointValue: self.output});
            }
            dataHelper.send(new DataMessage(CentralCMD.cen_0x00010013, {
                serverNO: item.serverNO,
                classID: item.classID,
                id: item.id,
                option: {
                    type: 2, //控制点值
                    points: points,
                    retry_times: retry_times,
                    retry_interval: retry_interval
                }
            }), function (err, data) {
                if(err) {
                    logger.error({msg: 'control failed', err: err});
                    hasError = true;
    
                    for(let i=0;i<points.length;i++){
                        let _p = points[i];
                        response.push({serverNO: _p.serverNO, classID: _p.classID, id: _p.id, result: [{code: -1, msg: '结果未知'}], success: 0})
                    }
                }else{
                    hasSuccess = true
                }
                if(data != undefined && data.result != undefined && data.result.length > 0){
                    logger.info('control result: %j', data);
                    response = response.concat(data.result)
                }
                cbNext();
            });
        }, function () {
            if(hasError) {
                if(hasSuccess){
                    dbLCL.insert_link_control_log(self.link_id, '下发控制部分成功', {target: self.target, output_value: self.output, result: response}, new Date());
                }else{
                    dbLCL.insert_link_control_log(self.link_id, '下发控制结果未知', {target: self.target, output_value: self.output, result: response}, new Date());
                }
                logger.warn('link: %d, control failed', self.link_id);
            }else{
                dbLCL.insert_link_control_log(self.link_id, '下发控制成功', {target: self.target, output_value: self.output, result: response}, new Date());
                logger.warn('link: %d, control success', self.link_id);
            }
        });
    }

};

pid_link_controller_controller.prototype.start = function () {
    this.stop(false);

    if(!this.enabled){
        return;
    }

    let self = this;
    parse_points(this.set_point, function (err, result) {
        if(err) return logger.error(err);

        self._set_points = result;
        var interval = self.Dt * 1000;//单位（秒）
        if(interval < 5000){
            interval = 5000;
        }
        self._control_timer = setInterval(function () {
            self.run();
        }, interval);

        //立即开始计算一次
        self.run();
    });
};

pid_link_controller_controller.prototype.stop = function (destory) {
    this.destoryed = destory;
    if(this._control_timer != undefined){
        clearInterval(this._control_timer);
        this._control_timer = undefined;
    }
};



function parse_points_ex(points, callback) {
    let _points = [];
    let _pvDic = {};
    for(let i=0;i<points.length;i++){
        let _p = points[i];
        if(!_pvDic[_p.id]){
            _pvDic[_p.id] = {};
        }
        _pvDic[_p.id][_p.pointIndex] = _p.pointValue;

        _points.push({deviceServerNO: _p.serverNO, deviceClassID: _p.classID, deviceID: _p.id, pointIndex: _p.pointIndex});
    }
    dbDP.find_device_point({$or: _points}, {_id: 0, deviceServerNO: 1, deviceClassID: 1, deviceID: 1, pointIndex: 1, binding: 1}, function (err, result) {
        if(err) return callback({msg: 'link control init failed', err: err});

        let _list = [];
        if(result && result.length > 0){
            let _dic = {};
            for(let i = 0;i<result.length;i++){
                let _p = result[i];
                if(_p.binding && _p.binding.id){
                    var collector = undefined;
                    if(_p.binding.classID == uiclassID.collector){
                        collector = _p.binding;
                    }else{
                        collector = rdbCNOR.get_parent_identity(_p.binding.serverNO, _p.binding.classID, _p.binding.id, uiclassID.collector);
                    }
                    if(collector){
                        if(!_dic[collector.id]){
                            _dic[collector.id] = {
                                serverNO: collector.serverNO,
                                classID: collector.classID,
                                id: collector.id,
                                points: []
                            };
                            _list.push(_dic[collector.id]);
                        }
                        let _binding = _p.binding;
                        _dic[collector.id].points.push({
                            serverNO: _binding.serverNO,
                            classID: _binding.classID,
                            id: _binding.id,
                            pointIndex: _binding.pointIndex,
                            pointValue: _pvDic[_p.deviceID][_p.pointIndex]
                        });
                    }
                }
            }
        }

        if(_list.length > 0){
            callback(null, _list);
        }else{
            callback({msg: 'link control init failed', err: 'set point not found'});
        }
    });
}

function time_line_link_controller_controller(link){
    this.link_id = link.id;
    this.link = link;

    if(link.option){
        this.time_line = link.option.time_line;
    }
    this.enabled = link.enabled;
    this.retry_times = link.retry_times || 1;
    this.retry_interval = link.retry_interval || 100;
}

time_line_link_controller_controller.prototype.control = function (mins) {
    if(this._time_line && this._time_line.length > 0){
        let self = this;
        ah.each_series(this._time_line, function (line_item, cbNextTime) {
            if(line_item.time == mins){
                logger.mark('link: %d, control points: %j', self.link_id, line_item.list);
                let hasError = false;
                let hasSuccess = false;
                let response = [];
                ah.each(line_item.list, function (item, cbNext) {
                    dataHelper.send(new DataMessage(CentralCMD.cen_0x00010013, {
                        serverNO: item.serverNO,
                        classID: item.classID,
                        id: item.id,
                        option: {
                            type: 2, //控制点值
                            points: item.points,
                            retry_times: self.retry_times,
                            retry_interval: self.retry_interval
                        }
                    }), function (err, data) {
                        if(err) {
                            logger.error({msg: 'control failed', err: err});
                            hasError = true;

                            for(let i=0;i<item.points.length;i++){
                                let _p = item.points[i];
                                response.push({serverNO: _p.serverNO, classID: _p.classID, id: _p.id, result: [{code: -1, msg: '结果未知'}], success: 0})
                            }
                        }else{
                            hasSuccess = true;
                        }
                        if(data != undefined && data.result != undefined && data.result.length > 0){
                            logger.info('control result: %j', data);
                            response = response.concat(data.result)
                        }
                        cbNext();
                    });
                }, function () {
                    if(hasError) {
                        if(hasSuccess){
                            dbLCL.insert_link_control_log(self.link_id, '下发控制部分成功', {points: line_item.points, result: response}, new Date());
                        }else{
                            dbLCL.insert_link_control_log(self.link_id, '下发控制结果未知', {points: line_item.points, result: response}, new Date());
                        }
                        logger.warn('link: %d, control failed', self.link_id);
                    }else{
                        dbLCL.insert_link_control_log(self.link_id, '下发控制成功', {points: line_item.points, result: response}, new Date());
                        logger.warn('link: %d, control success', self.link_id);
                    }
                    cbNextTime();
                });
            }else{
                cbNextTime();
            }
        }, function () {

        })
    }
};

time_line_link_controller_controller.prototype.start = function () {
    let self = this;
    self.stop();

    if(!this.enabled || !this.time_line || this.time_line.length <= 0){
        return;
    }

    function schedule_next() {
        let now = new Date();
        let day = now.GetDate();
        let interval = now - day;

        let mins = parseInt((interval) / 1000 / 60);//分钟数
        self.control(mins);

        let _next = (mins + 1) * 60 * 1000 + 1000;
        self._timer = setTimeout(function () {
            self._timer = undefined;
            schedule_next();
        }, _next - interval);
    }

    let _list = [];
    ah.each_series(this.time_line, function (item, cbNext) {
        parse_points_ex(item.points, function (err, list) {
            if(err) return cbNext(err);
            _list.push({
                time: item.time,
                list: list
            });
            cbNext();
        })
    }, function (err) {
        if(err) return logger.error({msg: 'load link points failed', err: err});

        self._time_line = _list;

        schedule_next();
    });
};

time_line_link_controller_controller.prototype.stop = function () {
    if(this._timer != undefined){
        clearTimeout(this._timer);
    }
};


function run() {
    function reload_link_control(link) {
        //删除之前旧的控制器
        remove_link_control(link);

        let controller = undefined;
        switch(link.type){
            case 1:
                controller = new pid_link_controller_controller(link);
                break;
            case 2:
                controller = new time_line_link_controller_controller(link);
                break;
            default:
                break;
        }
        if(controller != undefined){
            controller.start();
            controller_list.push(controller);
        }
    }

    function remove_link_control(link) {
        for(let i=0;i<controller_list.length;i++){
            let controller = controller_list[i];
            if(controller.link_id == link.id){
                controller.stop(true);
                controller_list.splice(i, 1);
                break;
            }
        }
    }

    notification.on(notification.Emitter.link_control, 'add', function (link) {
        reload_link_control(link);
    });
    notification.on(notification.Emitter.link_control, 'set', function (link) {
        reload_link_control(link);
    });
    notification.on(notification.Emitter.link_control, 'del', function (link) {
        remove_link_control(link);
    });

    var list = db.ramdb.lc.get_link_control_list();
    for(var i=0;i<list.length;i++){
        reload_link_control(list[i]);
    }
}

module.exports.run = run;