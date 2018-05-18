const EventEmitter = require('events')
const ConnectionFactory = require('./ConnectionFactory')
const express = require('express')
const SimpleRoute = require('./SimpleRoute')
const LOG = require('./LOG')

module.exports = class Device extends EventEmitter {
	constructor(jsonBuffer) {
		super()
		this.type = "Unknown"
		this.name = "Unnamed"
		this.status = "NOS"
		this.actions = []
		this.connection = undefined
		this.routes = [new SimpleRoute()]
		this.router = express.Router()

		if(jsonBuffer !== undefined) {
			this.type = jsonBuffer.type !== undefined ? jsonBuffer.type : this.type
			this.name = jsonBuffer.name !== undefined ? jsonBuffer.name : this.name
			this.status = jsonBuffer.status !== undefined ? jsonBuffer.status : this.status
			this.connection = jsonBuffer.connection !== undefined ? ConnectionFactory.createConnection(jsonBuffer.connection) : this.connection
			
			if(jsonBuffer.routes !== undefined) {
				let jsonRoutes = jsonBuffer.routes
				jsonRoutes.forEach(route => this._addRoute(route))
			}
		}

		this._initRouter()
	}

	toString() {
		let toString = {
			"name": this.name,
			"status": this.status, 
			//"actions": Object.keys(this.actions)
			"actions": this.actions
		}
		return toString
	}

	exec(actionName) {
		let actionExec = this.actions[actionName]
		if(actionExec !== undefined) {
			return actionExec(this)
		}
		return undefined
	}

	_addRoute(route) {
		let newRoute = new SimpleRoute(route)
		
		let rootRoute = this.routes.find(r => r.path === newRoute.path)
		if(rootRoute !== undefined) {
			this.routes.splice(this.routes.indexOf(rootRoute))
		}
		
		this.routes.push(newRoute)
		
	}

	_initRouter() {
		LOG.device(this, 'Init routes')

		let rootRoute = this.routes.find(r => r.path === '/')
		if(rootRoute !== undefined) {
			if(rootRoute.get) {
				this.router.get('/', (req, res) => {
					res.setHeader('Content-Type', rootRoute.type)
					res.send(JSON.stringify(this.toString()))
				})
			}

			if(rootRoute.post) {
				this.router.post('/', (req, res) => {
					let action = req.body.action
					if(action !== undefined) {
						let resAction = this.exec(action)
						let ret = `Action [${action}]`
						if(resAction === undefined) {
							resAction = `${ret} undefined`
						}
						else {
							LOG.device(this, `${ret} executed.`)
						}
						res.setHeader('Content-Type', rootRoute.type)
						res.send(JSON.stringify({status:this.status,action:resAction}))
					}
				})
			}
		}
	}

}