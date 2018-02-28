const express = require('express')
const router = express.Router()
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
		name: 'server_h',
		host: 'localhost',
		port: 8080
	}
}

server.listen(config.self.port, config.self.host, () => {
	console.log(`Listen on http://${config.self.host}:${config.self.port}`)
})

app.get('/', (req, res) => {
	console.log('client on /')
})

const clients = []
app.post('/register', (req, res) => {
	let client = req.body
	clients.push(client)

	if(client.device !== undefined && client.device === true
		&& client.routes !== undefined && client.routes !== null) {
		console.log('New routes find')
		console.log(client.routes)
		addRoutes(client)
	}

	res.writeHead(200)
	res.write(`Register on ${config.self.name}`)
	res.end()
})
app.post('/unregister', (req, res) => {
	let client = req.body
	clients.splice(clients.indexOf(client))

	res.writeHead(200)
	res.write(`Unegister on ${config.self.name}`)
	res.end()
})

// Event on exit to notify clients
process.on('SIGINT', () => {
	if(clients.length === 0)
		process.exit()
	notifyClients('close', () => process.exit())
})

/////////////////////////////////

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
		if(body) 
			console.log(body)
		if(err) 
			console.log(`Error on unregister on ${client.name}`)

		next()
	})
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
	console.log(`new route: ${route} -> ${forward}`)

	if('GET' === method) {
		return router.get(route, (req, res) => {
			forwarding(forward, res)
		})
	}
}

function forwarding(route, res) {
	request.get(route, (err, resp, body) => {
		res.send(body)
	})
}