/**
 * Created by wangxh on 2017/7/19.
 */

'use strict';

var uiclassID = {
    unknown: -1,         // 未知类型

    nameObject: 0,      // 命名对象
    server: 1,           // 服务器

    area: 2,             //区域(社区 项目)
    park: 3,            //园区
    building: 4,        //楼栋
    floor: 5,           //楼层
    room: 6,            //机房
    rowCabinet: 7,     //列柜
    province: 8,     //省
    city: 9,     //市

    lastArea: 9,//最后区域对象

    operatorObject: 10,//操作员对象
    operatorGroup: 11, //操作员组
    adminGroup:  12,//admin组
    
    operator: 16,       //操作员
    admin: 17,          //管理员
    lastOperatorObject: 19,//最后一个此类对象

    point: 20,          //采集点
    devicePoint: 21,    // 设备点
    boolPoint: 22,      // 开关点 20
    numberPoint: 23,    // 数值点 22
    floatPoint: 24,     // 浮点 21
    doublePoint: 25,    // 高精度浮点 805

    snmpPoint: 30,      //snmp点
    bacnetPoint: 35,    //bacnet点
    bacnetIPPoint: 36,    //bacnet点
    
    alarmPoint: 40,     //告警点

    generalDevice: 50,
    switcher: 51,
    nvr: 52,
    ipc: 53,
    controller: 54,
    generalDoor: 55,//普通门
    acc_controller: 56,//门禁控制器
    
    device              :100,//逻辑设备
    cabinet             :101,//机柜

    HPI_Cab		    :111,//	高压隔离柜
    HVS_Cab		    :112,//	高压开关柜
    OPS					:114,//	操作电源
    HED					:115,//	消谐装置
    GD					:116,//	接地装置
    Transformer		:121,//	变压器
    TransformerTC		:122,//	变压器温控仪
    LVS_Cab		    :131,//	低压开关柜
    LVU_Cab		    :132,//	低压母联柜
    Cap_Cab		    :133,//	电容补偿柜
    ActiveFilter		:134,//	有源滤波器
    ACS_Cab		    :135,//	交流配电柜
    ATS					:136,//	ATS
    SP_STS				:137,//	单相STS
    TP_STS				:138,//	三相STS
    PDB					:139,//	配电箱
    LVDG				:141,//	低压柴油发电机
    HVDG				:142,//	高压柴油发电机
    DayTank			:143,//	日用油箱
    StorageTank		:144,//	储油罐
    Refueling			:145,//	加油装置
    TCScreen			:146,//	总控制屏
    SCScreen			:147,//	分控制屏
    SP_UPS				:151,//	单相UPS
    TP_UPS				:152,//	三相UPS
    TM_UPS			    :153,//	三相模块化UPS
    Inverter			:154,//	逆变器
    HVDC				:161,//	HVDC电源
    AC_HVDC			:162,//	HVDC电源交流柜
    RC_HVDC			:163,//	HVDC电源整流柜
    DC_HVDC			:164,//	HVDC电源直流柜
    PS_48				:171,//	48V电源
    ACPS_48			:172,//	48V电源交流柜
    RCPS_48			:173,//	48V电源整流柜
    DCPS_48			:174,//	48V电源直流柜
    DC_DC				:176,//	直流-直流变换器
    LVC_B				:181,//	铅酸阀控蓄电池
    LIP_B				:182,//	磷酸铁锂电池
    TL_B				:184,//	三元锂离子电池
    ACCab		        :191,//	交流列头柜
    DCCab			    :193,//	直流列头柜
    HCab_48	    	:194,//	48V列头柜
    DCab_48     		:195,//	48V配电柜
    HVDC_Cab		    :196,//	高压直流配电柜

    ACPDU				:200,//	智能交流PDU
    DCPDU				:201,//	智能直流PDU
    ACMeter			:202,//	交流电量仪
    FACMeter           :203,// 电量仪-消防用电
    LACMeter           :204,// 电量仪-照明用电
    MACMeter           :205,// 电量仪-弱电监控用电
    OACMeter           :206,// 电量仪-其它用电
    DCMeter			:207,//	直流电量仪
    FC					:210,//	变频器
    FWP_AC				:211,//	冷冻水型精密空调(水冷空调)
    ACP_AC				:212,//	风冷型精密空调(列间空调)
    DSP_AC				:213,//	双冷源精密空调(很少用，忽略)
    AHU					:214,//	AHU(水冷空调)
    NF					:215,//	新风机(DX空调)
    OCU					:216,//	OCU(水冷空调)
    WFH					:217,//	湿膜加湿器(水冷空调)
    HPH					:218,//	高压微雾加湿器(水冷空调)
    Fan					:219,//	风机(DX空调)

    AirValve			:220,//	风阀
    CUnit              :221,// 制冷单元
    WCUnit			    :222,//	水冷冷水机组
    ACUnit		    	:223,//	风冷冷水机组
    CoolTower			:224,//	冷却塔
    WaterPump          :225,// 冷却水泵
    PWaterPump			:226,//	冷冻一次泵
    TWaterPump        :227,// 冷冻二次泵
    CSTank				:228,//	蓄冷罐
    Dosing				:229,//	加药装置
    CPD					:230,//	定压装置
    Pool				:231,//	水池(箱)
    PH_EXC				:232,//	板式换热器
    PropValve			:233,//	比例阀门
    SwitchValve		:234,//	开关阀门
    EHT					:235,//	电伴热
    Filter				:236,//	过滤器

    Temp				:311,//	温度
    Humidity			:312,//	湿度
    ENTH				:313,//	温湿度
    WaterLeak			:314,//	漏水
    LocLeak		    :315,//	定位漏水
    Liquid				:316,//	液位
    WaterPsr		    :317,//	水压力
    SFlowMeter		    :318,//	单向流量计
    DFlowMeter		    :319,//	双向流量计
    DWB_Temp			:320,//	干湿球温度
    WPD					:321,//	水压差
    RefLeak			:322,//	冷媒泄露
    CO2					:323,//	二氧化碳
    AirPsr		        :324,//	大气压力
    RevLeak		    :325,//	反渗漏
    ICC					:341,//	智能采集控制器
    EM_R				:351,//	机房能效计量


    lastDevice          : 999,  //最后一个设备类型

    cObject             : 1000,//采集对象
    cArea               : 1001,//区域

    collector           : 1010,//采集器

    cDevice             : 1011,//采集设备
    cBaDevice           : 1012,//Ba采集设备
    cS80Device          : 1013,//S80采集设备
    cBaIPDevice         : 1014,//Ba采集设备
    cAlarmHost          : 1015,//报警主机采集设备
    cDTU                  : 1016,//dtu
    cCS                  : 1017,//串口服务

    lastCObject         : 1200,//最后一个采集设备

    asset       : 2001,//资产
    supplier    : 2100,//供应商
    customer    : 2101,//客户
    parts        : 2102,//配件

    order       : 2200,//工单
    alarmOrder  : 2201,//告警工单
    drillOrder  : 2202,//演练工单
    assetOrder  : 2203,//维护工单(资产)
    inspectionOrder  : 2204,//移动巡检工单
    onPowerOrder: 2205,//上电工单
    offPowerOrder: 2206,//下电工单

    customOrder  : 2210,//自定义工单
};

module.exports = uiclassID;
module.exports.UPS_List = [uiclassID.SP_UPS, uiclassID.TP_UPS, uiclassID.TM_UPS];
module.exports.HVDC_List = [uiclassID.HVDC, uiclassID.AC_HVDC, uiclassID.DC_HVDC, uiclassID.RC_HVDC];
module.exports.AC_List = [uiclassID.FWP_AC, uiclassID.ACP_AC, uiclassID.DSP_AC, uiclassID.AHU, uiclassID.NF, uiclassID.OCU, uiclassID.WFH, uiclassID.HPH, uiclassID.Fan];
module.exports.WCUnit_List = [uiclassID.WCUnit, uiclassID.ACUnit];
module.exports.Pump_List = [uiclassID.WaterPump, uiclassID.PWaterPump, uiclassID.TWaterPump];