##版本记录：

###v1.0.0.26
    1.根据项目拆分报警配置
###v1.0.0.25
    1.报表模板根据项目分区
    2.合并修改告警报表
###v1.0.0.24
    1.添加intersvr模块的HTTP接口
###v1.0.0.23
    1.通知配置修改
###v1.0.0.22
    1.能耗计算修改
###v1.0.0.21
    1.告警通知修改
###v1.0.0.20
    1.设备设施修改
###v1.0.0.19
    1.增加点值接口
###v1.0.0.18
    1.新增沙盒功能
###v1.0.0.17
    1.设备点可配置多个告警条件
###v1.0.0.16
    1.同步钉钉机器人通知功能
###v1.0.0.15
    1.添加华润告警通知功能
    ***注意导入配置./config/plug_in.js
###v1.0.0.14
    1.新增接入设备（IO，DTU，CS）
    2.ODCC告警功能
    3.联动控制功能
    4.告警通知功能
###v1.0.0.13
    1.采集器配置使用文件方式保存
    2.能耗系统添加（水处理，点伴热）
    3.新增API接口
###v1.0.0.12
    1.楼栋、区域总能耗配置修改
    2.系统、用户日志添加
    3.机柜统计报表修改
###v1.0.0.11
    1.添加门禁（告警主机、通道）
###v1.0.0.10
    1.门禁接入
    2.添加机房当月能耗查询接口
###v1.0.0.9
    1.添加设备类型转换功能
###v1.0.0.8
    1.性能优化
    2.添加状态日志
    3.中控统一处理发送通知
    4.添加邮件通知
###v1.0.0.7
    1.添加授权功能
    2.修改pue拆分报表
    3.修改pue精度(保留3位小数)
###v1.0.0.6
    1.优化离线告警同步
    2.第三方告警事件接入
    3.拆分制冷系统空调分类
    4.资产统计报表bug修改
    5.添加告警手动结束功能
    6.添加对象关系添加、删除接口
###v1.0.0.5
    1.修改UPS负载率计算公式
    2.修改楼栋、区域总功率、总能耗计算方式
###v1.0.0.4
    1.添加移动巡检工单
###v1.0.0.3
    1.添加点值设置功能
###v1.0.0.2
    1.修改bug
    2.报表优化
    3.业务中控[0x00010005]命令参数格式修改（添加interval：更新时间限制）
###v1.0.0.1
    1.修改bug
    2.报表优化
    3.告警定时通知
    4.告警升级
    
##初始化
    mongo localhost/{db_name} EnsureIndex.sh
    mongo localhost/{db_name} EnsureIndex-data.sh
    node ./instances/init/init.js

-------------------------------------------------------------------------------

##备份/还原
    mongodump -h localhost -d xx -o /path
    mongorestore --drop -h localhost -d xx /path

##导入/导出
    mongodump -h localhost -d ecc_main -o /home/centos/project/dcim/db
    mongodump -h localhost -d ecc_data -o /home/centos/project/dcim/db
    
    mongorestore --drop -h localhost -d ecc_main /home/centos/project/dcim/db/ecc_main
    mongorestore --drop -h localhost -d ecc_data /home/centos/project/dcim/db/ecc_data

-------------------------------------------------------------------------------