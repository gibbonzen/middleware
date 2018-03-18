const express = require('express')
const request = require('request')
const { Readable} = require('stream')

module.exports = class SimpleRouter {
	constructor(device, client) {
		this.router = express.Router()
		this.device = device
		this.client = client

		this._initRouter()
	}

	_initRouter() {
		if(this.device.routes !== undefined) {
			this.device.routes.forEach(currentRoute => {
				let routeName = `/${this.device.type}${currentRoute.path}`
				let route = {
					url: `http://${this.client.host}:${this.client.port}`,
					path: routeName,
					header: currentRoute.type
				}


				if(currentRoute.get) {
					this.router.get(routeName, (req, res) => {
						this._getRequest(route, res)
					})
				}

				if(currentRoute.post) {
					this.router.post(routeName, (req, res) => {
						this._postRequest(route, req.body, res)
					})
				}

			})
		}
	}

	_getRequest(route, res) {
		let fullPath = route.url + route.path
		request.get(fullPath).pipe(res)
	}

	_postRequest(route, body, res) {
		let options = {
			headers: {'Content-Type': route.header},
			url: route.url + route.path, 
			json: true, 
			body: body
		}

		request.post(options).pipe(res)
	}
}