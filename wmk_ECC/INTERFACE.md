# 接口约定
	请求需要带session(即：客户端每次请求需要将服务器返回的headers中的set-cookie，部分信息以Cookie传回，注意cookie每次回变更)，使用session验证登陆
	headers：{
		'Content-Type': 'application/json; charset=utf-8',//json格式请求
		'Cookie': [...],//服务器返回的cookie信息
		'cmd': cmd//命令号(字符串)
	}
	响应：
	{
		code: 0,//错误码
		msg: '成功',//错误提示
		message: '详细提示消息',//调试信息
		data: {}//接口返回数据
	}

# 模块
##人员权限（端口：3100）
	1.路径：/login
	描述：登录,登陆后需要保存session，所有模块公用session，保持登陆状态
	参数：
	{account: '', password: ''}
	响应：
	{}
	2.路径：/logout
	描述：登出
	参数：
	{}
	响应：
	{}
	3.路径：/interface
	描述：请求,格式遵循[接口约定]

## 配置管理(端口:3000)
	路径：/interface
	描述：请求,格式遵循[接口约定]
	命令：(基础数据部分)


    //添加对象
    说明：
    基本数结构：
    园区（serverNO： 0）
        楼栋（serverNO：楼栋编号，不可重复，不能为0，设置界面填写）
            虚拟区域
            设备
            楼层（serverNO：与容器一致）
                设备
                机房
                    设备
                    列柜
                        机柜
                        
    园区下只能添加楼栋，不可添加其他对象。
    楼栋下可添加楼层、设备、虚拟区域
    虚拟区域下不可添加其他对象
    楼层下可添加机房、设备
    机房下可添加列柜、设备
    列柜下只能添加机柜
    设备、机柜下不可添加其他对象
    
    扩展信息:
    园区:
    {
        coverSize: 'number',//占地面积
        buildSize: 'number',//建筑面积
    }
    楼栋:
    {
        //项目配置
        coverSize: 'number',//占地面积
        buildSize: 'number',//建筑面积
        ratedFrame: 'number',//设计机架总数
        designInput: 'number',//市电总容量
        designCold: 'number',//制冷总容量
        designCaifa: 'number',//柴发总容量

        //容量计算配置
        ratedPower: 'number',//设计功率
        ratedColdPower: 'number',//制冷设计功率
        unitColdPower: 'number',//每套制冷设计功率
        ratedITPower: 'number',//设计IT功率
        spec: 'number',//规格(设计机柜数量)
        cpRatio: 'number',//制冷容量系数
        mdPoint: 'object',//制冷模式点
        ucPoint: 'object',//制冷单元数量点
        entry: 'array',//市电进线 

        //能耗配置
        copPoints: 'object',//cop计算点
        points: {
            power: {main: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], back: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], og: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], exclude: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}]},//总功率
            energy: {main: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], back: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], og: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], exclude: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}]},//总能耗
        }
        
        //服务通讯配置
        host: 'string',         //IP地址
        port: 'integer',     //数据端口
    }
    虚拟区域:
    {
        //基本配置
        waterUsePoints: {//用水量
            points: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], //用水量点
            exclude: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}] //排除点
        }
        powerUsePoints: {//用电量
            points: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], //用电量点
            exclude: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}] //排除点
        },

        projectID: 'string', //小区编号
        address: 'object',//位置 {longitude: 123, latitude: 123}
    }
    机房：
    {
        //基本配置
        rmType: 'number',//机房类型
        position: 'object',//经纬度{lo: 0, la: 0}

        ratedPower: 'number',//容量配置
        ratedITPower: 'number',//设计IT功率
        ratedColdPower: 'number',//制冷设计功率
        spec: 'number',//规格(设计机柜数量)
        cpRatio: 'number',//制冷容量系数
        statePoint: 'object',//状态点{serverNO: 0, classID: 0, id: 0, pointIndex: 0}
        points: {
            water: {type: 1, key: 'waterUsage', points: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], exclude: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}]}//用水量
        }
    }
    设备：
    {
        //基础信息
        type: 'object',//设备模板{system: 0, group: 0, id: 0}
        
        //容量配置
        ratedPower: 'number',//额定功率
        ratedColdPower: 'number',//额定制冷功率
        ratedElec: 'number',//额定电流
        ratedCold: 'number',//额定制冷量
        ratedLoad: 'number',//额定负荷
        ratedInPower: 'number',//输入额定功率
        ratedOutPower: 'number',//输出额定功率
        ratedInElec: 'number',//输出额定电流
        ratedOutElec: 'number',//输出额定电流

        //物理信息
        aNO: 'string',//资产编号
    }
    机柜：(在设备的基础上添加属性)
    {
        cabType: 'number',//机柜类型
        spec: 'number',//规格(U位数)
        pdu: 'number',
        
        //能耗配置
        points: {//容量计算配置，能耗数据通过机房内机柜相加计算
            power: {points: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], exclude: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}]},
            energy: {type: 1, key: 'enUsage', points: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}], exclude: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}]}
        }
    }
    温湿度、温度：(在设备的基础上添加属性)
    {
        enTHType: 'number',//温湿度类型
    }
    
    其他设备：
    门禁控制器
    {
        type: 'integer',//控制器类型(type=1表示添加的是大华设备；type=0表示添加的是支持腾讯协议的设备)
        option: 'object'//控制器参数{host: '', port: 0, device: '', user: '', pass: '', opid: 0, opname: ''}
    }
    普通门
    {
        channelNO: 'integer'//通道号
    }
    NVR
    {
        type: 'integer',//nvr类型
        host: 'string',
        port: 'integer',
        username: 'string',
        password: 'string',
        devNO: 'string'//设备编号
    }
    IPC(仅可添加在【NVR】下)
    {
        channelNO: 'integer',//通道号
    }
    
    采集拓扑：
    基本结构
    园区
        楼栋
            采集器
                采集单元
    楼栋下可添加采集器（采集器的容器：{serverNO: 楼栋的serverNO, classID: 0, id: 0}）
    采集器下可添加采集单元
    采集单元：
    {
        type: 'integer',//设备类型
        serial_no: 'string',//序列号、MAC地址
        cMode: 'integer',//采集方式
        //采集参数
        //串口设备：{portName: '', address: 0},
        //1.modbus tcp采集单元:{mIPAddress: '', mPort: 0, address: 0}, 
        //2.snmp采集单元: {mbIPAdress: '', mbPort: 0, community: '', snmpVer: 0}, 
        //3.opc采集单元: {host: '', port: 0, auth_type: ''}
        //4.s80采集单元:{}, 
        //5.ba采集单元：{bIPAdress: '', bPort: 0, protocol_type: '', username: '', password: '', token_url_part: '', signalr_server_url: '', signalr_backendurl: ''}
        //6.baip采集单元：{identifier：''}
        //7.OPC
        //8.报警主机采集单元(限定HTTP方式采集)：{host：'', port: 0, user: '', pass: ''}
        //9.串口(风机)设备：{portName: '', groupAddress: 0, address: 0},
        //10.串口(亿天TSI)设备：{portName: '', address: 0},
        //11.IO模块（modbus tcp 主动连接）:{} ****MAC地址填入serial_no***
        //12.DTU子设备（modbus dtu）:{address: 0}
        //13.串口服务子设备（modbus cs）:{address: 0}
        cOption: 'object',
        cInterval: 'integer',//采集间隔
        cDelay: 'integer',//采集延时
        cTimeout: 'integer',//采集超时时间
        config: 'object'//其他配置数据
    }
    采集器<继承于采集单元>：
    {
        colType: 'number',//采集器类型(1:一体化数据采集器(A9),2:BA辅助服务,3:S80对接服务,4:SNMP辅助服务,5:bacnet ip辅助服务,6:opc辅助服务,7: 报警服务)
        guid: 'string',//随机生成
        csIPAddress: 'string',//采集服务IP
        csPort: 'number',//采集服务端口
        calExp: 'number',//是否计算表达式

        com_param: 'object',//串口配置<仅一体化数据采集器需要>
        err_param: 'object',//异常参数配置
        ntp_param: 'object',//ntp服务配置
        
        other_param: 'object',//其他配置
    }
###mgr_0x00000001: '0x00000001',//上传
    参数结构: {type: 0, reqGuid: '', reqOrder: 0, offset: 0, content: ''}
    
###mgr_0x00000002: '0x00000002',//上传(完成)
    参数结构: {type: 0, reqGuid: ''}
    
###mgr_0x00000003: '0x00000003',//下载
    参数结构: {type: 0, reqGuid: '', reqOrder: 0, length: 0, offset: 0}
    
###mgr_0x00000004: '0x00000004',//下载(完成)
    参数结构: {reqGuid: ''}
###mgr_0x00000005: '0x00000005',//获取服务器授权时间
    参数结构: {serverNO: 0, classID: 0, id: 0}
    响应: {
        start: '',//可能没有
        end: ''//可能没有
    }
###mgr_0x00000006: '0x00000006',//获取服务器授权文件
    参数结构:  {serverNO: 0, classID: 0, id: 0, type: 0},type: 0:未授权文件  1：授权文件
    响应: {
        file: ''//base64字符串
    }
###mgr_0x00000007: '0x00000007',//上传服务器授权文件
    参数结构:  {serverNO: 0, classID: 0, id: 0, file: ''}//base64字符串
    响应: {}

###mgr_0x00010001: '0x00010001',//创建对象
    参数结构
    {
        container: {//容器对象id
            serverNO: 0,
            classID: 0,
            id: 0
        },
        object: {//对象信息
            serverNO: 0,
            classID: 0,
            fullName: '',
            name: '',//别名
            restData: {
                ...//扩展数据填响应类型对象部分
            },
            description: ''//描述
        }
    }
###mgr_0x00010002: '0x00010002',//修改对象
    参数结构
    {
        serverNO: 0,
        classID: 0,
        id: 0
        fullName: '',
        name: '',//别名
        restData: {
            ...//扩展数据填响应类型对象部分
        },
        description: ''//描述
    }
###mgr_0x00010003: '0x00010003',//删除对象
    参数结构:{serverNO: 0, classID: 0,id: 0}
###mgr_0x00010004: '0x00010004',//获取对象信息
    参数结构:{serverNO: 0, classID: 0,id: 0}
###mgr_0x00010005: '0x00010005',//添加设备类型
    参数结构
    {
        system: 1,
        systemName: '强电',
        group: 0,
        groupName: '',
        id: 0,
        name: '',
        desc: '',
        pointList: [{
            pointIndex: 0,
            pointType: 0,//点类型，AI、AO。。。
            busType: 0,//业务类型
            name: '',
            desc: '',//描述
            unit: '',
            option: {
                transform: {
                    scaling： 0,//系数（忽略）
                    offset: 0,//偏移（忽略）
                    reversal： 0,//反转（忽略）
                    precision: 1,//精度
                },
                his: {
                    interval: 300000,//保存间隔
                    threshold: {
                            percentage: 0,//百分比
                            absolute: 0,//阈值
                        }
                },
                condition: [
                    {type: 1, value: 0}//type: lt: 0,lte: 1,eq: 2,gte: 3, gt: 4,ne: 5
                ]
            },
            config: {
                alarm: [{id: 0}],
                value: {
                    expression: {//非自身设备点
                        source: [{serverNO: 0, classID: 0, id: 0, pointIndex: 0}],
                        formula: 'GetPointValue(0,0,0)'
                    }
                    /*expression: {//自身设备点
                        source: [{pointIndex: 0},{pointIndex: 1}],
                        formula: 'GetPointValue(serverNO,id,0)*GetPointValue(serverNO,id,1)'
                    }*/
                }
            }
        }],
        config: {
            esType: {system: 0, group: 0},//能耗系统
            mPoints: {//能耗配置参数
                power: {points: [1,2,3], exclude: [4]},
                energy: {type: 1, key: 'enUsage', points: [1,2,3], exclude: [4]}
                //其他能耗参数
            },
            defaultData: {
                ratedPower: 'number',//额定功率
                ratedColdPower: 'number',//额定制冷功率
                ratedElec: 'number',//额定电流
                ratedCold: 'number',//额定制冷量
                ratedLoad: 'number',//额定负荷
                ratedInPower: 'number',//输入额定功率
                ratedOutPower: 'number',//输出额定功率
                ratedInElec: 'number',//输出额定电流
                ratedOutElec: 'number',//输出额定电流
            },//对象默认配置(配置后，在创建设备对象时，将对应默认值填入对应属性中)
            classID: 0,//设备类型
            ...//其他自定义配置
        }
    }
###mgr_0x00010006: '0x00010006',//修改设备类型
    参数结构：{
        template: {...}//（同0x00010005）
        option: {
            areas: [{serverNO: 0, classID: 0, id: 0}],//应用范围，不填改属性，则全部应用
            binding: 0,//应用绑定配置,(0：否，1:是)
            value: {apply: 0, pointIndexList: [1,2,3]},//应用表达式配置,apply:(0：否，1:是),pointIndexList: 应用的点索引列表
            alarm: 0,//应用告警告警配置,(0：否，1:是)
            other: 0//应用其他参数(精度、历史保存条件等),(0：否，1:是)
        }
    }
###mgr_0x00010007: '0x00010007',//删除设备类型
    参数结构：{system: 0,group: 0,id: 0}
###mgr_0x00010008: '0x00010008',//获取设备类型详细信息
    参数结构：{system: 0,group: 0,id: 0}
###mgr_0x00010009: '0x00010009',//获取设备类型列表
    参数结构：{}
###mgr_0x00010010: '0x00010010',//对象扩展属性设置
	参数结构：{serverNO: 0, classID: 0, id: 0, key: '', value: {自定义数据}}
###mgr_0x00010011: '0x00010011',//对象扩展属性获取
    参数结构：{serverNO: 0, classID: 0, id: 0, key: ''}
###mgr_0x00010012: '0x00010012',//添加容器关系
    参数结构：{serverNO: 0, classID: 0, id: 0, childServerNO: 0, childClassID: 0, childID: 0}
###mgr_0x00010013: '0x00010013',//删除容器关系
    参数结构：{serverNO: 0, classID: 0, id: 0, childServerNO: 0, childClassID: 0, childID: 0}
###mgr_0x00010014: '0x00010014',//移动容器关系
    参数结构：{serverNO: 0, classID: 0, id: 0, container: {serverNO: 0, classID: 0, id: 0}}
    
    mgr_0x00010020: '0x00010020',//设备点配置设置(每次必须配置一个设备的所有点配置)
    参数结构：{
        serverNO: 0,//逻辑设备ID
        classID: 0,
        id: 0,
        points: [{
            pointIndex: 0,//逻辑设备点索引
            option: {
                transform: {
                    scaling: 0,//系数（忽略）
                    offset: 0,//偏移（忽略）
                    reversal: 0,//反转（忽略）
                    precision: 1,//精度
                },
                his: {
                    interval: 300000,//保存间隔(默认)
                    threshold: {
                        percentage: 0,//百分比
                        absolute: 0//阈值
                    },
                    others: [{
                        serverNO: 0,
                        classID: 0,
                        id: 0,
                        pointIndex: 0,//设备点
                        type: 0,//判断条件
                        value: 0,//判断值
                        interval: 0,//符合条件时保存的间隔
                    }]
                }
            },
            config: {
                value: {
                    expression: {//表达式
                        source: [{
                            serverNO: 0, //如果是本身设备点可以不填
                            classID: 0, //如果是本身设备点可以不填
                            id: 0, //如果是本身设备点可以不填
                            pointIndex: 0
                        }],
                        formula: 'GetPointValue(0,0,0)'
                    }
                },
                alarm: [{
                    id: 0,//告警类型ID
                    shield: {//告警屏蔽
                        enabled: 0,
                        start: '',
                        end: ''
                    },
                    hangup: {//告警挂起
                        enabled: 0,
                        start: '',
                        end: ''
                    }
                }]
            },
            binding: {//设备点绑定
                serverNO: 0,//采集设备点
                classID: 0,
                id: 0,
                pointIndex: 0
            }
        }]
    }

	mgr_0x00020001: '0x00020001',//创建采集对象(参数同0x00010001)
	mgr_0x00020002: '0x00020002',//修改采集对象(参数同0x00010002)
	mgr_0x00020003: '0x00020003',//删除采集对象(参数同0x00010003)
	mgr_0x00020004: '0x00020004',//获取采集对象信息(参数同0x00010004)

	mgr_0x00020005: '0x00020005',//添加采集设备类型
    参数结构
    {
        id: 0,
        name: '',
        desc: '',
        pointList: [{
            pointIndex: 0,
            pointType: 0,//点类型
            name: '',
            desc: '',//描述
            unit: '',
        }],
        data: ''//xml数据（base64格式）
    }
	mgr_0x00020006: '0x00020006',//修改采集设备类型
	mgr_0x00020007: '0x00020007',//删除采集设备类型
	mgr_0x00020008: '0x00020008',//获取采集设备类型详细信息
	mgr_0x00020009: '0x00020009',//获取采集设备类型列表
	
	mgr_0x00020010: '0x00020010',//设置采集设备点配置
	参数：{
	serverNO: 0, 
	classID: 0, 
	id: 0, 
	points: [
	    {
	        pointIndex: 0,
	        pointType: 0,
	        name: '',
	        unit: '',
	        desc: '',
	        config: {...},//具体类型具体定义，S80对接服务:{s80: {serverNO: 0, classID: 0, id: 0, pointIndex: 0}},BA：{objectOrPropertyId: ''},BAIP: {object_id: '', object_type: ''},OPC: {node_id: '', node_type: ''}
	        option: {
                transform: {
                    precision: 0//精度
                },
                his: {
                    interval: 0//保存间隔
                }
	        }
	    }
	]}
    mgr_0x00020011: '0x00020011',//获取采集设备点配置
    参数：{serverNO: 0, classID: 0, id: 0}
	
## 查询(端口:3200)
    itr_0x00000001: '0x00000001',//树结构(区域)
    itr_0x00000002: '0x00000002',//树结构(包含设备)
    itr_0x00000003: '0x00000003',//查询子对象信息
    itr_0x00000004: '0x00000004',//查询设备点列表(带告警配置，不用需要配置请使用:0x00000008)
    itr_0x00000007: '0x00000007',//查询采集设备点列表
    itr_0x00000008: '0x00000008',//设备模板(点表)
    
    itr_0x00000040: '0x00000040',//获取采集拓扑结构
    
    
# 告警（端口:3300）
    alm_0x00010003: '0x00010003',//告警类型设置
    {
        id: 1,//ID
        name: '',//名称
        condition: {
            type: 1,//条件（枚举：条件定义）
            value: 0,//只有产生阈值，没有结束阈值
            genValue: 0,//产生阈值(产生和结束同时存在)
            endValue: 0//结束阈值(产生和结束同时存在)
        },
        option: {
            type: 0,//告警分类
            level: 0,//告警等级
            priority: 0,//优先级
            meaning: 0,//意义（填名称）
            startDelay: 0,//开始延时
            endDelay: 0,//结束延时
            mold: 0,//0异常通知1离线通知
        }
    }
    alm_0x00010004: '0x00010004',//告警类型删除
    参数：{id: 0}
    alm_0x00010005: '0x00010005',//告警类型列表获取
    参数：{}

#定义
##class id

---------------------------------------------------------