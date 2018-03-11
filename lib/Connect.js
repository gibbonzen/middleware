const EventEmitter = require('events')
const request = require('request')
const LOG = require('./LOG')
const SHA1 = require('./Sha1')

module.exports = class Connect extends EventEmitter {

	constructor(connect, retry) { 
		super()

		this.name = connect.name || 'server'
		this.ip = connect.ip || '127.0.0.1'
		this.host = connect.host || 'localhost' 
		this.port = connect.port || 8080
		this.register = connect.register.connect || {path: '/register', method: 'GET'}
		this.unregister = connect.register.disconnect || {path: '/unregister', method: 'GET'}
		this.type = connect.type || {'Content-Type': 'application/json'}
		this.client = connect.body || ''
		this.client.token = this._shaToken()

		this.retry = retry || false
		this.connected = false

		this._listen()
	}

	isConnected() {
		return this.connected
	}

	_buildOptions(route) {
		return {
			headers: this.type,
			json: this.type['Content-Type'] === 'application/json' ? true : false,
			url: `http://${this.host}:${this.port}${route}`,
			body: this.client
		}
	}

	connect() {
		switch(this.register.method) {
			case 'GET':
				this._get()
				break;
			case 'POST':
				this._post(this.register.path, this._onConnect)
				break;
		}
	}

	_onConnect(self, err, res) {
		if(!err && res.statusCode === 200) {
			LOG.server(res.body)
			self.emit('connect', true)
		}
		else {
			if(err) {
				LOG.log(LOG.LEVEL.WARNING, `Connection error on ${self.host}:${self.port}`)
			}
			else {
				LOG.server(`Connection refused by ${self.name}`)
			}
			self.emit('connect', false)
		}
	}

	disconnect(next) {
		if(this.connected) {
			this._post(this.unregister.path, (s, e, r, b) => {
				this._onStandardResponse(s, e, r, b)
				this.connected = false
				next()
			})
		}
	}

	_onStandardResponse(self, err, res, body) {
		if(!err && res.statusCode === 200) {
			LOG.server(body)
		}
	}

	_get() {
		let url = this._buildOptions().url
		request.get(url, (err, res, body) => {
			console.log(body)
		})
	}

	_post(route, next) {
		let options = this._buildOptions(route)
		let that = this
		request.post(options, (err, res, body) => {
			next(that, err, res, body)
		})
	}

	_listen() {
		this.on('connect', status => {
			if(status) {
				this.connected = true
				return
			}
			LOG.client(`Retry to connect...`)
			if(this.retry) {
				let that = this
				setTimeout(
					function() {
						that.connect()
					}, 5000
				)
			}
		})
	}

	_shaToken() {
		return SHA1(this.client.name + this.client.port + 'lESMARMOttES')
	}

	sendRoutes(devices) {
		if(this.connected) {
			LOG.client(`Sending routes to ${this.name}`)
			this.client.devices = devices
			this._post(this.register.path, this._onStandardResponse)
		}
	}

}