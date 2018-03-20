'use strict'

const Device = require('./Device')
const EventEmitter = require('events').EventEmitter
const fs = require('fs')
const path = require('path')
const os = require('os')
const chokidar = require('chokidar')
const RaspiCam = require('raspicam')

const Status = {
	STOPPED: 0x00,
	STARTED: 0x01,

	_get: function(status) {
		return Status[Object.keys(Status).filter(k => "_get" !== k).find(k => k === status)]
	}
};

module.exports = class Camera extends Device {
	constructor(jsonBuffer) {
		super(jsonBuffer)
		this.status = Status._get(jsonBuffer.status)
		this.options = jsonBuffer.options
		this.actions = {
			"start": this.start,
			"stop": this.stop
		}

		this.camera = null
		this.fileWatcher = null
	}

	start(self) {
		if(Status.STARTED === self.status) {
			return "Camera is already started."
		}
		else {
			self._buildStreamArgs()
			self.camera.start()
			self.status = Status.STARTED
			self._watch()
			self.emit('start')
			return "Start the camera."
		}
	}

	stop(self) {
		if(Status.STOPPED === self.status) {
			return "Camera is already stopped."
		}
		else {
			self.camera.stop()
			self.status = Status.STOPPED
			self._unWatch()
			return "Stop the camera."
		}
	}

	_buildStreamArgs() {
		this.folder = this.options.directory
		this.image = this.options.filename
		let fullPath = path.join(this.folder, this.image)
		this.camera = new RaspiCam({
			mode: "timelapse",
			output: fullPath,
			encoding: "jpg",
			timelapse: this.options.timelapse,
			timeout: this.options.timeout,
			width: this.options.width,
			height: this.options.height,
			quality: this.options.quality,
			rotation: this.options.rotation
		})
	}

	_watch() {
		let fullPath = path.join(this.folder, this.image)
		this.camera.on("read", (err, timestamp, filename) => {
			fs.readFile(fullPath, (err, data) => {
				if(err) return
				this.emit("image", data)
			})
		})
	}

	_unWatch() {
		this.camera.stop()
		this.emit('close')
	}

	Status() {
		return Status
	}

	_initRouter() {
		super._initRouter()
		this._getStream()
		this._getPicture()
	}

	_getStream() {
		let BOUNDARY = "myboundary"
		let headersStream = {
			'Cache-Control': 'no-cache', 
			'Cache-Control': 'private', 
			'Pragma': 'no-cache', 
			'Content-Type': 'multipart/x-mixed-replace; boundary=' + BOUNDARY
		}

		this.router.get('/stream', (req, res, next) => {

			if(this.status === Status.STARTED) {
				res.writeHead(200, headersStream)
				this.on('image', data => {
					res.write("--myboundary\r\n"); 
					res.write("Content-Type: image/jpeg\r\n"); 
					res.write("Content-Length: " + data.length + "\r\n"); 
					res.write("\r\n"); 
					res.write(Buffer(data),'binary'); 
					res.write("\r\n"); 
				})
			}
			else {
				let thumb = fs.createReadStream('./images/thumb.jpg')
				thumb.pipe(res)
			}

		})
	}

	_getPicture() {
		this.router.get('/picture', (req, res) => {
			if(this.status === Status.STARTED) {
				res.setHeader('Content-Type', 'application/json')
				res.send(JSON.stringify({
					status: this.status,
					action: 'Camera is already use for stream...'
				}))
			}

			let picture = 'picture.jpg'
			let cam = new RaspiCam({
				mode: "photo",
				output: this.options.directory + picture,
				encoding: "jpg",
				width: this.options.width,
				height: this.options.height,
				quality: this.options.quality,
				rotation: this.options.rotation
			})

			cam.start()
			cam.on('read', (err, timestamp, filename) => {
				let img = fs.readFileSync(this.options.directory + filename)
				res.setHeader('Content-Type', 'image/jpeg')
				res.end(img, 'binary')
			})
		})
	}
}

