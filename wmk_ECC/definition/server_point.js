/**
 * Created by wangxh on 2018/4/10.
 */

'use strict';

module.exports = {

    state: 1,  //服务器(状态)
    cpu: 2,     //cpu负载
    memory: 3,  //内存空间
    main_disk: 4,    //硬盘空间(系统)
    data_disk: 5,    //硬盘空间(数据)

    auth_imminent_expired: 6,
    auth_expired: 7,
    not_auth: 8,

};