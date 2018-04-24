const Device = require('./Device')
const LOG = require('./LOG')
const sensor = require('node-dht-sensor')

module.exports = class Meteo extends Device {
	constructor(jsonBuffer) {
		super(jsonBuffer);
		this.temperature = null
		this.humidity = null
		this._readSensor(this)
	}

	_initRouter() {
		super._initRouter()
		LOG.device(this, 'Init specific routes')

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

	_readSensor() {
		sensor.read(22, 4, (err, temp, hum) => {
			if(!err) {
				this.temperature = temp.toFixed(1),
				this.humidity = hum.toFixed(1)
			}
		})
	}

	getTemperature(self) {
		self._readSensor()
		return {
			value: self.temperature,
			unit: '°C'
		}
	}

	getHumidity(self) {
		self._readSensor()
		return {
			value: self.humidity,
			unit: '%'
		}
	}

}
