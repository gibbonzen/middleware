const Device = require('./Device')
const LOG = require('./LOG')

module.exports = class Meteo extends Device {
	constructor(jsonBuffer) {
		super(jsonBuffer);
	}

	_initRouter() {
		super._initRouter()
		LOG.device(this, 'Init specific routes')

		this._getRequest('/temperature', this.getTemperature)
		this._getRequest('/humidity', this.getHumidity)

	}

	_getRequest(path, data) {
		this.router.get(path, (req, res, next) => {
			res.write(JSON.stringify(data()))
			res.end()
			next()
		})
	}

	getTemperature() {
		return {
			value: 15,
			unit: '°C'
		}
	}

	getHumidity() {
		return {
			value: 70,
			unit: '%'
		}
	}

}
