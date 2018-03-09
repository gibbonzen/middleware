const express = require('express')
const router = express.Router()
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const request = require('request')
const bodyParser = require('body-parser')
const Tools = require('./lib/Tools')
const LOG = require('./lib/LOG')
const EventEmitter = require('events')
const Register = require('./lib/Register')

const config = {
	self: {
		name: 'server_h',
		host: 'localhost',
		port: 8080
	}
}

server.listen(config.self.port, config.self.host, () => {
	LOG.server(`Listen on http://${config.self.host}:${config.self.port}`)
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', (req, res) => {
	LOG.client('Client on /')
})

// REGISTER 
// To add routes from client
const clients = []
Register.onRegister((req, res) => {
	let client = req.body
	addClient(client)

	res.writeHead(200)
	res.write(`Register on ${config.self.name}`)
})
Register.onUnregister((req, res) => {
	console.log('ici')
	let client = req.body
	clients.splice(clients.indexOf(client))

	res.writeHead(200)
	res.write(`Unregister form ${config.self.name}`)
})

app.use(Register.router)

function addClient(client) {
	if(clients.find(c => c.name === client.name) !== undefined) {
		LOG.log(LOG.LEVEL.INFO, 'Client is allready register')
	}
	else {
		clients.push(client)

		if(client.device !== undefined && client.device === true
			&& client.routes !== undefined && client.routes !== null) {
			LOG.server('New routes find')
			addRoutes(client)
		}
	}
}

function addRoutes(client) {
	client.routes.forEach(route => {
		addRoute(route, client)
	})
}

function addRoute(route, client) {
	app.use('/', createRoute('GET', route, client))
}

function createRoute(method, route, client) {
	let forward = `http://${client.host}:${client.port}${route}`
	LOG.client(`New route: ${route} -> ${forward}`)

	if('GET' === method) {
		return router.get(route, (req, res) => {
			forwarding(forward, res)
		})
	}
}

function forwarding(route, res) {
	request.get(route, (err, resp, body) => {
		let header = resp.headers['content-type'].split(';')[0]
		res.setHeader('Content-Type', header)
		res.send(body)
	})
}

// Event on exit to notify clients
process.on('SIGINT', () => {
	if(clients.length === 0)
		process.exit()
	notifyClients('close', () => process.exit())
})

function notifyClients(event, next) {
	clients.forEach(c => notify(c, event, next))
}

function notify(client, event, next) {
	let options = {
		headers: {'Content-Type': 'application/json'},
		url: `http://${client.host}:${client.port}/unregister`,
		json: true,
		body: config.self
	}

	request.post(options, (err, res, body) => {
		if(!err && res.statusCode == 200) {

		}

		next()
	})
}