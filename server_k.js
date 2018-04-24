const express = require('express')
const app = express()
const server = require('http').Server(app)
const cors = require('cors')
const io = require('socket.io')(server)
const request = require('request')
const bodyParser = require('body-parser')
const Tools = require('./lib/Tools')
const path = require('path')
const LOG = require('./lib/LOG')
const Connect = require('./lib/Connect')
//const EventEmitter = require('events')
const Register = require('./lib/Register')
const DeviceFactory = require('./lib/DeviceFactory')

// MODE DEV // 
global.MODE_DEV = process.argv.find(arg => arg === "MODE_DEV")


app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

const config = Tools.loadJsonFile('./config_server_k.json')

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

function notifyServer(event, next) {
	//toHome.emit(event, this)
	//toHome.on('disconnected', () => next())
	toHome.disconnect(next)
}


// -------------------------------------------
// Loading all device from json files
const devices = []
let devicesPath = './devices/'
Tools.readDir(devicesPath) // Read all devices into directory 
	.filter(f => path.extname(f).match(/json/)) // Filter json files
	.forEach(f => {
		let device = DeviceFactory.createNewDevice(
			Tools.loadJsonFile(path.resolve(devicesPath + f))
		)

		if(device !== undefined) {
			devices.push(device)
			app.use(`/${device.type}`, device.router)
		}
	})
config.self.devices = devices
toHome.sendRoutes(devices)

// -------------------------------------------
