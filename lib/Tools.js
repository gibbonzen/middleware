const fs = require('fs');
const path = require('path')

module.exports = class Tools {
	static readDir(path, options) {
		return fs.readdirSync(path, options);
	}

	static loadJsonFile(path) {
		return JSON.parse(fs.readFileSync(path, 'utf8'));
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


	static encode_base64(file) {
		fs.readFile(path.resolve(file),function(error, data) {
			if(error) {
				throw error
			}
			else {
				let buf = Buffer.from(data)
				let base64 = buf.toString('base64')
		
				return base64
			}
		})
	}


	static decode_base64(base64str , file){
		let buf = Buffer.from(base64str, 'base64')
		fs.writeFile(path.resolve(file), buf, function(error) {
			if(error) {
				throw error
			}
			else {
				return true
			}
		})
	}
}