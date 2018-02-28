const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const request = require('request')
const bodyParser = require('body-parser')

const EventEmitter = require('events')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

const config = {
	self: {
		name: 'server_k',
		device: true,
		host: 'localhost',
		port: 8081, 
		routes: [
			'/camera',
			'/temperature'
		]
	},
	server_h: {
		name: 'server_h',
		host: 'localhost', 
		port: 8080
	}
}

server.listen(config.self.port, config.self.host, () => {
	console.log(`Listen on http://${config.self.host}:${config.self.port}`)
	connectTo(config.server_h)
})

function connectTo(server) {
	console.log(`Try to connect to home server on http://${server.host}:${server.port}`)

	request.post({
		headers: {'Content-Type': 'application/json'},
		url: `http://${server.host}:${server.port}/register`, 
		json: true,
		body: config.self
	}, (err, res, body) => {
		if(err) {
			console.log(`Connection error on ${server.name}`)

			if('ECONNREFUSED' === err.code) {
				retry(server)
			}
		}

		if(body) console.log(body)
	})
}

function retry(server) {
	console.log('retry')
	connectTo(server)
}

app.post('/unregister', (req, res) => {
	let client = req.body
	if(client.name === config.server_h.name) {
		res.writeHead(200)
		res.write(`Unregister from ${config.self.name}`)
		res.end()

		registration.emit('reconnect', client)
	}
})

const registration = new EventEmitter()
registration.on('reconnect', server => {
	retry(server)
})






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
		let myRouter = Router(device.type)

		app.use(device.path, myRouter.router)
//		io.use(myRouter.socket)
	}
}

/*io.on('connection', (socket) => {
	console.log('connection')
})*/