const express = require('express');
const DeviceModel = require('../models/Device');
const DeviceSettingModel = require('../models/DeviceSetting');
const DeviceTelemetryModel = require('../models/DeviceTelemetry');
const DeviceStateSeriesModel = require('../models/DeviceStateSeries');
const timelineConverter = require('../lib/timelineConverter');
const { NumericValueEntity, StateEntity } = require('./Entity');
const { ButtonAction, SelectAction, RangeAction, } = require('./Action');

class Device {
  id = null;
  platform = null;
  name = null;
  icon = null;
  approuter = express.Router();
  setting = {
    toDisplayList: function () { return {} }.bind(this),
    toTitle: function () { return "" },
    toSubTitle: function () { return "" },
  };
  entities = {};
  GetStatusInfos() { }
  Tick(seconds) { }

  constructor(id, platform, name) {
    this.id = id;
    this.platform = platform;
    this.name = name;
  }

  async Start() {
    await this.ReadSettings();

    this.approuter.get('/', this.WebMainPage.bind(this));
    this.approuter.post('/entity/action/', this.WebEntityAction.bind(this));
    this.approuter.post('/setting/update', this.WebSettingUpdate.bind(this));
    this.approuter.post('/setting/delete', this.WebSettingDelete.bind(this));
    this.approuter.get('/graph/telemetry/:entity', this.WebGetTelemetryGraph.bind(this));
    this.approuter.get('/graph/state/:entity', this.WebGetStateGraph.bind(this));

    this.LinkUpEntities();
  }

  async Stop() {
    this.RemoveAllListeners();
  }

  LinkUpEntities() {
    if (this.entities)
      for (const key of Object.keys(this.entities)) {
        this.entities[key].LinkUpActions();
        this[key] = this.entities[key];
      }
  }

  RemoveAllListeners() {
    if (this.entities)
      for (const key in this.entities)
        this.entities[key].removeAllListeners();
  }

  WebMainPage(req, res, next) {
    res.render('platforms/device', {
      title: this.name,
      device: this,

      NumericValueEntity: NumericValueEntity,
      StateEntity: StateEntity,

      ButtonAction: ButtonAction,
      SelectAction: SelectAction,
      RangeAction: RangeAction,
    });
  }
  async WebEntityAction(req, res, next) {
    const entity = req.body.entity;
    const action = req.body.action;
    const actionparams = req.body.actionparams;

    // console.log([entity, action, actionparams]);

    if (this.entities.hasOwnProperty(entity)) {
      const entityobj = this.entities[entity];
      for (const actionobj of entityobj.actions)
        if (actionobj.code == action) {
          await actionobj.Execute(actionparams);
          break;
        }
    }
    res.send("OK");
  }
  async WebSettingUpdate(req, res, next) {
    await this.AdaptSetting(req.body.name, req.body.value);
    res.send("OK");
  }
  async WebSettingDelete(req, res, next) {
    await this.AdaptSetting(req.body.name, null);
    res.send("OK");
  }
  WebGetTelemetryGraph(req, res, next) {
    const entitycode = req.params.entity;
    const days = Math.max(1, Math.min(req.query.days, 30));

    DeviceTelemetryModel
      .GetByDeviceId(this.id, entitycode, days)
      .then(rows => {
        let timeline = [];
        for (const row of rows)
          timeline.push([row.DateTime.getTime(), row.Data]);

        timeline = timelineConverter.moveAverage(timeline, 30);
        timeline = timelineConverter.reduceTimeline(timeline, 1920);

        res.send(JSON.stringify(timeline));
      })
      .catch(err => { next(err); });
  }
  WebGetStateGraph(req, res, next) {
    const entitycode = req.params.entity;
    const days = Math.max(1, Math.min(req.query.days, 30));

    if (this.entities.hasOwnProperty(entitycode)) {
      const entity = this.entities[entitycode];
      if (entity instanceof StateEntity) {

        DeviceStateSeriesModel
          .GetByDeviceId(this.id, entitycode, days)
          .then(rows => {

            const startdate = new Date();
            startdate.setTime(startdate.getTime() - days * 86400000);

            rows = DeviceStateSeriesModel.NormalizeByStartDate(rows, startdate);
            for (const row of rows)
              row.State = entity.StateToGraph(row.State);
            const stat = DeviceStateSeriesModel.GenerateTimelineStat(rows);

            res.send(JSON.stringify(stat));
          })
          .catch(err => { next(err); });

      }
    }
  }

  async ReadSettings() {
    const settingread = await DeviceSettingModel.GetSettingsSync(this.id);
    for (const key of Object.keys(settingread)
      .filter(key => !key.startsWith('_'))
      .filter(key => key in this.setting))
      this.setting[key] = settingread[key];
  }

  async AdaptSetting(name, value) {
    const keys = Object.keys(this.setting);
    if (!(name.startsWith('_')))
      if (keys.includes(name)) {
        this.setting[name] = value ? value : null;
        await this.WriteSetting(name, value);
      }
  }

  async WriteSetting(name, value) {
    await DeviceSettingModel.UpdateSettingSync(this.id, name, value);
  }

  async WriteSettings() {
    await DeviceSettingModel.UpdateSettingsSync(this.id, this.setting);
  }

  static IsValidDeviceName(name) { return name.match(/^[a-z0-9_]{1,20}$/); }
}
module.exports = Device;