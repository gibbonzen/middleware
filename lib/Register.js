const express = require('express')
const router = express.Router()
const SHA1 = require('./Sha1')
const LOG = require('./LOG')

const tokens_clients = []

let doOnRegister = undefined
let doOnUnregister = undefined

function onRegister(callback) {
	doOnRegister = callback
}

function onUnregister(callback) {
	doOnUnregister = callback
}

function shaToken(client) {
	return SHA1(client.name + client.port + 'lESMARMOttES')
}

function authorized(res, client) {
	if(client.token === shaToken(client)) {
		tokens_clients[client.name] = client.token
		LOG.server(`${client.name} connected.`)

		return true
	}
	return false
}

function removeToken(client) {
	if(tokens_clients[client.name] === client.token) {
		tokens_clients.splice(tokens_clients.indexOf(client.name))
		LOG.server(`${client.name} disconnected.`)
	}
}

router.post('/register', (req, res, next) => {
	let client = req.body
	let ok = authorized(res, client)

	if(ok) {
		doOnRegister(req, res)
	}
	else {
		res.writeHead(444)
		res.end()
	}
	next()
})

router.post('/unregister', (req, res, next) => {
	doOnUnregister(req, res)

	removeToken(req.body)
	next()
})

module.exports = {
	onRegister: onRegister,
	onUnregister: onUnregister,
	router: router
}