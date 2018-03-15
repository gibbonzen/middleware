const Device = require('./Device')

module.exports = class Meteo extends Device {
	constructor(jsonBuffer) {
		super(jsonBuffer);
	}

}
