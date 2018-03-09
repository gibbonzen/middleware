const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const request = require('request')
const bodyParser = require('body-parser')
const Tools = require('./lib/Tools')
const LOG = require('./lib/LOG')
const Connect = require('./lib/Connect')
//const EventEmitter = require('events')
const Register = require('./lib/Register')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

const config = Tools.loadJsonFile('./config.json')

let connection = config.server
connection.body = config.self

const toHome = new Connect(connection, true)

server.listen(config.self.port, config.self.host, () => {
	LOG.client(`Listen on http://${config.self.host}:${config.self.port}`)
	toHome.connect()
})

// REGISTER
// Unregister is used by server to notify client her disconnection
Register.onUnregister((req, res) => {
	let client = req.body
	if(client.name === config.server.name) {
		LOG.log(LOG.LEVEL.WARNING, `Disconnect from ${config.server.name}.`)
		toHome.emit('connect', false)
	}
})

app.use(Register.router)

// Event on exit to notify server
process.on('SIGINT', () => {
	if(!toHome.isConnected())
		process.exit()
	notifyServer('disconnect', () => process.exit())
})

function notifyServer(event, disconnect) {
	toHome.emit(event, this)
	disconnect()
}


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

const Router = require('./lib/Route')

for(let index in devices) {
	if(devices.hasOwnProperty(index)) {
		let device = devices[index]
		let myRouter = Router(device.type)

		app.use(device.path, myRouter.router)
	}
}