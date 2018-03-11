const path = require('path')
const LOG = require('./LOG')

module.exports = class DeviceFactory {
	static createNewDevice(buffer) {
		deviceFind(buffer.name)

		let module = requireMod(buffer.type)
		if(module !== undefined) {
			return new module(buffer)
		}
	}
}

function deviceFind(name) {
	LOG.server(`Device [${name}] find.`)
}

function requireMod(module) {
		let first = module.substr(0, 1)
		module = module.replace(first, first.toUpperCase())
	try {
		console.log(module)
		let devPath = `./${module}`
		const deviceModule = require(devPath)
		return deviceModule
	}
	catch(e) {
		LOG.log(LOG.LEVEL.INFO, `Error on loading ${module}`)
	}
}