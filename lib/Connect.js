const EventEmitter = require('events')
const request = require('request')
const LOG = require('./LOG')

module.exports = class Connect extends EventEmitter {

	constructor(connect, retry) { 
		super()

		this.name = connect.name || 'server'
		this.ip = connect.ip || '127.0.0.1'
		this.host = connect.host || 'localhost' 
		this.port = connect.port || 8080
		this.register = connect.register.connect || '/register'
		this.unregister = connect.register.disconnect || '/unregister'
		this.type = connect.type || {'Content-Type': 'application/json'}
		this.method = connect.register.method || 'GET'
		this.client = connect.body || ''

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
		switch(this.method) {
			case 'GET':
				this._get()
				break;
			case 'POST':
				this._post(this.register, this._onConnect)
				break;
		}
	}

	_onConnect(self, err, res) {
		if(!err && res.statusCode === 200) {
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

	disconnect() {
		this._post(this.unregister, this._onDisconnect)
	}

	_onDisconnect(self, err, res) {
		if(!err && res.statusCode === 200) {
			LOG.client(`Disconnected...`)
		}
	}

	_get() {
		let url = this._buildOptions().url
		request.get(url, (err, res, body) => {
			console.log(body)
		})
	}

	_post(route, next) {
		let serverTo = this._buildOptions(route)
		let that = this

		console.log(serverTo, that)

		request.post(serverTo, (err, res, body) => {
			next(that, err, res, body)
		})
	}

	_listen() {
		this.on('connect', status => {
			if(!status) {
				LOG.client(`Retry to connect...`)
				if(this.retry) {
					let that = this
					setTimeout(
						function() {
							that.connect()
						}, 5000
					)
				}
			}
			else {
				LOG.client(`Connect on ${this.name}`)
				this.connected = true
			}
		})

		this.on('disconnect', () => {
			LOG.client(`Send disconnecting message`)
			this.disconnect()
		})
	}

}