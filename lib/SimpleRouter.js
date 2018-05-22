const express = require('express')
const request = require('request')
const { Readable} = require('stream')
const LOG = require('./LOG')

const http = require('http')

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
				LOG.server(routeName)

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
		//request.get(fullPath).pipe(res)

		let request = http.get(fullPath, (response) => {	
			let statusCode = response.statusCode
			let contentType = response.headers['content-type']
			//let contentLength = response.headers['content-length']
			
			//console.log(`Code: ${statusCode}`)
			//console.log(`Content-Type: ${contentType}`)
			//console.log(`Content-Length: ${contentLength}`)

			response.on('error', err => {
				console.log('Error !!!')
				res.end()
			})
			
			let data = []
			response.on('data', chunk => {
				data.push(chunk)
			})
			
			response.on('end', () => {
				let buf = Buffer.concat(data)
				res.writeHeader(200, {'Content-Type': contentType})
				res.end(buf, 'binary')
			})
		})
	
		request.on('timeout', () => {
			console.log('Timeout !!!')
			request.abort()
		
			res.writeHeader(200, {'Content-Type': 'text/plain'})
			res.end('Timeout !!!')
		})
		
		request.on('error', err => {
			console.log(`Connection failure: ${err.code}`)
		})

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
