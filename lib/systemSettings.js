class SystemSettings {
  Init() {
    const properties =
      Object.getOwnPropertyNames(this)
        .filter(item => !item.startsWith("_"));

    const SystemSettingModel = require('../models/SystemSetting');
    return SystemSettingModel.GetAll()
      .then(settingrows => {
        for (const settingrow of settingrows)
          if (properties.includes(settingrow.Name))
            this[settingrow.Name] = settingrow.Value;
        logger.info("[SystemSettings] Settings initialized");
      });
  }

  _timer = null;
  LazyStore() {
    if (this._timer)
      clearTimeout(this._timer);

    this._timer = setTimeout(function () {
      this._timer = null;

      const rows = [];
      for (const property of Object.getOwnPropertyNames(this).filter(item => !item.startsWith("_")))
        rows.push({ Name: property, Value: this[property] });

      const SystemSettingModel = require('../models/SystemSetting');
      SystemSettingModel.StoreAll(rows);

      logger.info("[SystemSettings] Settings stored");
    }.bind(this), 2000);
  }

  AdaptFromObject(obj) {
    const properties =
      Object.getOwnPropertyNames(this)
        .filter(item => !(item.startsWith("_")));

    for (const objprop of Object.getOwnPropertyNames(obj))
      if (properties.includes(objprop))
        this[objprop] = obj[objprop];

    this.LazyStore();
  }

  //London
  latitude = 51.5;
  longitude = 0;
  get Latitude() { return parseFloat(this.latitude); }
  set Latitude(val) { this.latitude = val; this.LazyStore(); }
  get Longitude() { return parseFloat(this.longitude); }
  set Longitude(val) { this.longitude = val; this.LazyStore(); }

  openweathermapapikey = '';
  get OpenweathermapApiKey() { return this.openweathermapapikey; }
  set OpenweathermapApiKey(val) { this.openweathermapapikey = val; this.LazyStore(); }
}

module.exports = SystemSettings;