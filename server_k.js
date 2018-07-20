const express = require('express')
const app = express()
const server = require('http').Server(app)
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
const cors = require('cors')

process.title = "serverk"

// MODE DEV // 
global.MODE_DEV = process.argv.find(arg => arg === "MODE_DEV")

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.all('/*', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})


global.config = Tools.loadJsonFile('./config_server_k.json')
//const pi = new Hardware(config.hardware)

server.listen(config.self.port, config.self.host, () => {
	LOG.client(`Listen on http://${config.self.host}:${config.self.port}`)
})

// Event on exit to notify server
process.on('SIGINT', () => {
	process.exit()
})


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

// -------------------------------------------
