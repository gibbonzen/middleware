const fs = require('fs');
const path = require('path')

module.exports = class Tools {
	static readDir(root, options) {
		return fs.readdirSync(root, options);
	}

	static loadJsonFile(root) {
		return JSON.parse(fs.readFileSync(root, 'utf8'));
	}

	static readJsonFile(file) {
		return JSON.parse(file);
	}

	static getStringEnum(e, name) {
		for(var [key, value] of Object.entries(e)) {
			if(value === name) {
				return key;
			}
		}
		return name;
	}

	static buildHeaderJson(response, status) {
		response.set("Content-Type", "application/json");
		response.set(status);
		return response;
	}

	static buildResponseBody(data) {
		return JSON.stringify(data);
	}

	static serialize(device) {
		let filename = device.name.substr(0, 1).concat(device.name.substr(1, device.name.length-1))
		let fullPath = path.resolve(`devices/${filename}.json`)
		let rawfile = Tools.loadJsonFile(fullPath)
		rawfile.status = device.status

		if(device.type === 'door') {
			rawfile.automate.auto = device.automate.auto
			rawfile.automate.hopen = device.automate.hopen
			rawfile.automate.hclose = device.automate.hclose
		}

		fs.writeFileSync(fullPath, JSON.stringify(rawfile, null, '  '))
	}

	static getHours(time) { // hh:mm
		let split = time.split(':')
		return split[0]
	}

	static getMinutes(time) { // hh:mm
		let split = time.split(':')
		return split[1]
	}

	static getSecondes(time) { // hh:mm
		let split = time.split(':')
		return split[2]
	}
}
