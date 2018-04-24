const express = require('express')
const request = require('request')
const LOG = require('./LOG')
const http = require('http')
const path = require('path')
const fs = require('fs')
const Tools = require('./Tools')

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
		
		try {
			//request.get(fullPath).pipe(res)

			let requete = http.get(fullPath, (response) => {
				let contentType = response.headers['content-type']
				let headers = response.headers

				let multipart = false
				if(contentType !== undefined && 
					contentType.indexOf('multipart') > 1) {
					console.log('multipart')
					multipart = true
				}

				response.on('error', err => {
					console.log('Error !!!')
					res.end()
				})
				
				let data = []
				response.on('data', chunk => {
					data.push(chunk)					
				})
				
				response.on('end', () => {
					res.writeHead(200, headers)
					let buf = Buffer.concat(data)
					res.end(buf, 'binary')
				})
			})
			
			requete.on('timeout', () => {
				console.log('Timeout !!!')
				request.abort()
			
				res.writeHeader(200, {'Content-Type': 'text/plain'})
				res.end('Timeout !!!')
			})
			
			requete.on('error', err => {
				console.log(`Connection failure: ${err.code}`)
			})


		} catch(e) {
			LOG.log(LOG.LEVEL.WARNING, e.message)
		}
	}

	_postRequest(route, body, res) {
		let options = {
			headers: {'Content-Type': route.header},
			url: route.url + route.path, 
			json: true, 
			body: body
		}

		try {
			request.post(options).pipe(res)
		} catch(e) {
			LOG.log(LOG.LEVEL.WARNING, e.message)
		}
	}
}