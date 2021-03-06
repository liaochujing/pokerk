#!/usr/bin/env bash
db.hisalarm.ensureIndex({serverNO: 1, classID: 1, id: 1}, {name: 'his_alarm_identity'})
db.hisalarm.ensureIndex({'source.serverNO': 1, 'source.classID': 1, 'source.id': 1}, {name: "his_alarm_source"})
db.hisalarm.ensureIndex({area: 1, serverNO: 1}, {name: 'his_alarm_area'})
db.hisalarm.ensureIndex({startTime: 1}, {name: 'his_alarm_st'})

db.asset_log.ensureIndex({aNO: 1})
db.asset_log.ensureIndex({time: 1})
db.cabinet_power_state_log.ensureIndex({serverNO: 1, classID: 1, id: 1, start: 1, end: 1})
db.cabinet_power_state_log.ensureIndex({serverNO: 1, areaID: 1, start: 1, end: 1})

db.user_operator_log.ensureIndex({time: 1})
db.system_log.ensureIndex({time: 1})

db.dmdata.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.dmdata.ensureIndex({serverNO: 1, areaID: 1})
db.dmdata.ensureIndex({time: 1})
db.dmday.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.dmday.ensureIndex({serverNO: 1, areaID: 1})
db.dmday.ensureIndex({time: 1})
db.dmmon.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.dmmon.ensureIndex({serverNO: 1, areaID: 1})
db.dmmon.ensureIndex({time: 1})

db.dmdata_cache.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.dmdata_cache.ensureIndex({serverNO: 1, areaID: 1})
db.dmdata_cache.ensureIndex({time: 1})
db.dmday_cache.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.dmday_cache.ensureIndex({serverNO: 1, areaID: 1})
db.dmday_cache.ensureIndex({time: 1})

db.rmdata.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.rmdata.ensureIndex({time: 1})
db.rmday.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.rmday.ensureIndex({time: 1})
db.rmdata_cache.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.rmdata_cache.ensureIndex({time: 1})
db.rmday_cache.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.rmday_cache.ensureIndex({time: 1})

db.rmmon.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.rmmon.ensureIndex({time: 1})

db.amdata.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.amdata.ensureIndex({time: 1})
db.amday.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.amday.ensureIndex({time: 1})
db.amdata_cache.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.amdata_cache.ensureIndex({time: 1})
db.amday_cache.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.amday_cache.ensureIndex({time: 1})

db.ammon.ensureIndex({serverNO: 1, classID: 1, id: 1})
db.ammon.ensureIndex({time: 1})

db.link_control_log.ensureIndex({link_id: 1})