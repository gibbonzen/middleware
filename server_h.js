const express = require('express')
const router = express.Router()
const app = express()
const cors = require('cors')
const server = require('http').Server(app)
const io = require('socket.io')(server)
const request = require('request')
const bodyParser = require('body-parser')
const Tools = require('./lib/Tools')
const LOG = require('./lib/LOG')
const EventEmitter = require('events')
const Register = require('./lib/Register')
const SimpleRouter = require('./lib/SimpleRouter')

const config = Tools.loadJsonFile('./config_server_h.json')

server.listen(config.self.port, () => {
	LOG.server(`Listen on http://${config.self.host}:${config.self.port}`)
})

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))



app.get('/', (req, res) => {
	
})

// REGISTER
// To add routes from client
const clients = []
Register.onRegister((req, res) => {
	let client = req.body
	addClient(client)

	countRoutes(client, true)	

	res.writeHead(200)
	res.write(`Register on ${config.self.name}`)
	res.end()	
})
Register.onUnregister((req, res) => {
	let client = req.body
	clients.splice(clients.indexOf(client))

	removeRoutes(client)
	countRoutes(client, false)

	res.writeHead(200)
	res.write(`Unregister form ${config.self.name}`)
	res.end()
})

app.use(Register.router)

function addClient(client) {
	if(clients.find(c => c.name === client.name) !== undefined) {
		LOG.log(LOG.LEVEL.INFO, 'Client is allready register')
	}
	else {
		clients.push(client)

		if(client.device !== undefined && client.device === true
			&& client.devices !== undefined && client.devices !== null) {
			LOG.server('New routes find...')
		}
	}
	addRoutes(client)
}

function removeRoutes(client) {
	client.devices.forEach(route => {
		config.self.routes.splice(config.self.routes.indexOf(route))
	})
}

function addRoutes(client) {
	if(client.devices !== undefined) {
		client.devices.forEach(device => {
			addRoute(device, client)
		})
	}
}

function addRoute(device, client) {
	if(config.self.router === undefined) {
		config.self.router = []
	}

	let simpleRouter = new SimpleRouter(device, client)
	config.self.router.push(simpleRouter)
	app.use('/', simpleRouter.router)

	config.self.routes.push('/' + device.type)
}

function countRoutes(client, addOrRemove) {
	let word = addOrRemove ? "added" : "removed"
	let count = 0;
	client.devices.forEach(d => count += d.routes.length)
	LOG.log(LOG.LEVEL.INFO, `-> ${count} routes ${word} for ${client.name}`)

	config.self.router.forEach(r => LOG.server(r))
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
			// TODO ?
		}

		next()
	})
}
