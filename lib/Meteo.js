const Device = require('./Device')
const LOG = require('./LOG')
const sensor = require('node-dht-sensor')

module.exports = class Meteo extends Device {
	constructor(jsonBuffer) {
		super(jsonBuffer);
	}

	_initRouter() {
		super._initRouter()
		LOG.device(this, 'Init specific routes')

		this.lastUpdate = undefined
		this.temperature = 0
		this.humidity = 0
		this._readSonde(this)

		this._getRequest('/temperature', this.getTemperature)
		this._getRequest('/humidity', this.getHumidity)
	}

	_getRequest(path, data) {
		this.router.get(path, (req, res, next) => {
			res.setHeader('Content-Type', 'application/json')
			res.write(JSON.stringify(data(this)))
			res.end()
			next()
		})
	}

	getTemperature(self) {
		self._readSonde(self)
		return {
			value: self.temperature,
			unit: '°C'
		}
	}

	getHumidity(self) {
		self._readSonde(self)
		return {
			value: self.humidity,
			unit: '%'
		}
	}

	_readSonde(self) {
		let now = new Date()
		if(self.lastUpdate !== undefined) {
			let uptime = self._addMinutes(self.lastUpdate, 15)
			if(uptime > now) return
		}

		this.lastUpdate = now
		sensor.read(22, 4, function(err, temperature, humidity) {
			if (!err) {
				self.temperature = temperature.toFixed(1)
				self.humidity = humidity.toFixed(1)
			}
		})
	}

	_addMinutes(date, minutes) {
  	  return new Date(date.getTime() + minutes*60000);
	}
}
