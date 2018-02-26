const express = require('express')
const app = express()
const server = require('http').Server(app)

const config = {
	host: 'localhost',
	port: 8081
}

server.listen(config.port, config.host, () => console.log(`Listen on http://${config.host}:${config.port}`))


let devices = {
	camera: {
		path: '/camera',
		type: 'CameraRoute'
	},
	temperature: {
		path: '/temperature', 
		type: 'TemperatureRoute'
	}
}

const Router = require('./Route')

for(let index in devices) {
	if(devices.hasOwnProperty(index)) {
		let device = devices[index]
		let router = new Router(device.type).router

		app.use(device.path, router)
	}
}