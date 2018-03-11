const express = require('express')
const request = require('request')

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

				if(currentRoute.get) {
					this.router.get(routeName, (req, res) => {
						let route = {
							url: `http://${this.client.host}:${this.client.port}`,
							path: routeName,
							header: currentRoute.type
						}
						this._get(route, res)
					})
				}

				/*if(currentRoute.acceptPOST()) {
					this.router.post('/', (req, res) => {

						next()
					})
				}*/

			})
		}
	}

	_get(route, res, next) {
		request.get(route.url + route.path, (err, resp, body) => {
			res.setHeader('Content-Type', route.header)
			res.send(body)
		})
	}

	_post(route, body, res, next) {

	}
}