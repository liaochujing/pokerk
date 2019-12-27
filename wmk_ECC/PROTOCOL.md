#数据对接协议(TCP)：
##协议格式
    消息头：[uint32(LE)(包体长度)]
    消息体：[二进制数据(包体：json格式字符串)] 

##消息格式：
    请求：{
        cmd: 0,//命令号
        msgId: 0,//消息id，服务原样返回
        data: {//请求参数(如果有)
        }
    }
    响应:{
        status: 0,//返回结果
        msgId: 0,//消息id，请求的msgId
        cmd: 0,
        data: {//响应数据(如果有)
        }
    }

##通知格式：
    请求:{
        type: 0,//通知类型
        data: {//通知数据
        }
    }

----------------------------------------------------

#数据中控：

##命令
###0x00000001：
    描述：验证,连接上后需要立即验证,否则不会处理请求、通知、发送通知
    参数：{
        type： 0, #20：采集服务,,0x100000:其他模块
        notifies: [0x0, 0x1]#注册通知
    }
    响应：{}
###0x00000002:
    描述：保活
    参数：{}
    响应：{}
###0x00010001：
    描述：查询实时点值(设备)
    参数：{
        identity: {serverNO: 0, classID: 0, id: 0}
    }
    响应：[
        {i: 0, v: 0, t: '1970-01-01 00:00:00'}
    ]
###0x00010002：
    描述：查询实时点值(设备点)
    参数：{
        serverNO: 0
        devices: {
            1:[//设备id
                1,2,3//点索引列表,如果点列表为空，或长度为0，返回该设备的所有点值
            ]
        },
        interval: 0,//过滤最近n毫秒内更新过点值的才返回<如果没有该参数，全部返回>
    }
    响应：{
        1:{//设备ID
            1:0,//点索引:点值
            2:0,
            3: 8
        }
    }
###0x00010003：
    描述：查询设备状态
    参数：{
        devices: [{serverNO: 1, classID: 1, id: 1}]
    }
    响应： [
        {serverNO: 1, classID: 1, id: 1, online: 1}
    ]
###0x00010004：
    描述：查询设备状态
    参数：{
        serverNO: 0,
        classID: 0,
        id: 0,
        pointIndex: 0,
        pointValue: 0
    }
    响应： {
        code: 0,
        msg: ''
    }
###0x00010005：
    描述：注册点值通知(设备)<注册返回成功后，立即通知现有的点值>
    参数：[
        {serverNO: 0, classID: 0, id: 0},
        {serverNO: 0, classID: 0, id: 0}
    ]
    响应： {
        code: 0,
        msg: ''
    }
###0x00010006：
    描述：注销点值通知(设备)
    参数：[
        {serverNO: 0, classID: 0, id: 0},
        {serverNO: 0, classID: 0, id: 0}
    ]
    响应： {
        code: 0,
        msg: ''
    }

##通知(接收)：
###0x0000F001:
    描述:设备点上传通知
    数据:[
        {
            serverNO: 0,
            classID: 0,
            id: 0,
            list: [
                [1,0,123456],
                [2,0,123456],
            ]
        }
    ]

###0x0000F002:
    描述:设备状态上传通知
    数据: [
        {
            serverNO: 0,
            classID: 0,
            id: 0,
            online: 0//0：掉线，1：在线
        }
    ]
    
##通知(推送)：
###0x0002F001
    描述：告警产生
    数据：{
        point: {serverNO: 0, classID: 0, id: 0, pointIndex: 0},
        data: {pointValue: 0, pointValueTime: ''},
        alp: {id: 0}
    }
###0x0002F002
    描述：告警结束
    数据：{
        point: {serverNO: 0, classID: 0, id: 0, pointIndex: 0},
        data: {pointValue: 0, pointValueTime: ''},
        alp: {id: 0}
    }
###0x0002F003:
    描述：设备状态改变<过时>
###0x0002F004:
    描述：第三方事件上传
    数据：[
        {
            classID: 0, 
            source: {serverNO: 0, classID: 0, id: 0, pointIndex: 0},
            type: 0,
            desc: '',
            level: 0,
            startTime: '',
            start: {pointValue: 0, pointValueTime: ''},
            third_party_id: ''
        }
    ]
###0x0002F005:
    描述：第三方事件操作上传
    数据：[
        {action: 0, option: {pointValue: 0, pointValueTime: ''}, third_party_id: '', time: ''}
    ]
    
----------------------------------------------------

#业务中控
##命令
###0x00000001：
    描述：验证,连接上后需要立即验证,否则不会处理请求、通知、发送通知
    参数：{
        type： 0, #0x20：采集服务,0x100000:其他模块
        notifies: [0x0, 0x1]#注册通知
    }
    响应：{}
###0x00000002:
    描述：保活
    参数：{}
    响应：{}
###0x00010001
    描述：查询实时点值(设备)
    参数：{
        identity: {serverNO: 0, classID: 0, id: 0}
    }
    响应：[
        {i: 0, v: 0, t: '1970-01-01 00:00:00'}
    ]
###0x00010002
    描述：查询实时点值(设备点)
    参数：{
        serverNO: 0,//服务器编号
        devices: {
            1: [//设备ID
                1,2,3//设备点索引
            ]
        }
    }
    响应：{
        1: {//设备id
            1：0,//点索引:点值
            2: 0,
            3: 0
        }
    }
###0x00010003：
    描述：查询设备状态
    参数：{
        devices: [{serverNO: 1, classID: 1, id: 1}]
    }
    响应： [
        {serverNO: 1, classID: 1, id: 1, online: 1}
    ]
###0x00010004：
    描述：查询设备状态
    参数：{
        serverNO: 0,
        classID: 0,
        id: 0,
        pointIndex: 0,
        pointValue: 0
    }
    响应： {
        code: 0,
        msg: ''
    }
###0x00010005：
    描述：查询实时点值(设备点)
    参数：{
        '1_1': [1,2,3],
        '1_2': [1,2,3],
    }
    响应：{
        '1_1': {
            1: 0,
            2: 0,
            3: 0
        },
        '1_2': {
            1: 0,
            2: 0,
            3: 0
        }
    }
    
##通知(发送)
###0x0000AF01
    描述:对象创建通知
    数据:{
        container: {serverNO: 0, classID: 0, id: 0},
        object: {serverNO: 0, classID: 0, id: 0, fullName: '', restData: {...}, ...}
    }
###0x0000AF02
    描述:对象删除通知
    数据:{
        serverNO: 0, 
        classID: 0, 
        id: 0
    }
###0x0000AF03
    描述:对象修改通知(设备屏蔽会有此通知)
    数据:{
        object: {serverNO: 0, classID: 0, id: 0, fullName: '', restData: {...}, ...}
    }
###0x0000AF06
    描述:设备点配置变更通知
    数据:{
        serverNO: 0, 
        classID: 0, 
        id: 0,
        points: [//设备点配置变更会有此信息（可能没有）
            {
                pointIndex: 0,
                config: {},//（可能没有）
                binding: {}//（可能没有）
            }
        ],
        reload: 0,//设备新创建或模板变更导致重新生成点表时会有此信息（可能没有）
    }
###0x0000FF02
    描述:告警类型变更(新增、修改)
    数据:{//(同数据库结构一致)
        id: 0,
        name: '',
        condition: {},
        option: {},
        config: {}
    }
###0x0000FF03
    描述:告警类型删除
    数据:{
        id: 0
    }
###0x0000FF06
    描述:采集设备类型变更
    数据:{
        id: 0,
        name: '',
        desc: '',
        pointList: [
            {
                name: '',
                unit: '',
                pointType: 0,
                pointIndex: 0,
                option: {}
            }
        ],
        config: {},
        data: '',
        time: ''
    }
###0x0000FF07
    描述:采集设备类型删除
    数据:{
        id: 0
    }
----------------------------------------------------