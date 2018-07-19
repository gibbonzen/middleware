'use strict'

const Device = require('./Device')
const EventEmitter = require('events').EventEmitter
const fs = require('fs')
const path = require('path')
const os = require('os')
const chokidar = require('chokidar')
const RaspiCam = require('raspicam')
const Tools = require('./Tools')
const LOG = require('./LOG')
const { exec } = require('child_process')

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
		this.variations = jsonBuffer.variations
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
		this._getPictureB64()
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

	_lastShot(res, encode) {
		fs.readFile(this.options.directory + "picture.jpg", (err, data) => {
			if(err) {
				res.status(404).send(err)
			}
			else {
				if(encode) {
					res.end(new Buffer(data).toString('base64'))
				}
				else {
					res.end(data, 'binary')
				}
			}
		})
	}
	
	_getPicture() {
		this.router.get('/picture.jpg', (req, res) => {
			let now = new Date()
			if(this.lastShot !== undefined) {
				let uptime = new Date(this.lastShot.getTime() + 10000) // 10 seconds between 2 shots
				if(uptime > now) {
					LOG.device(this, "Send last shot...")
					this._lastShot(res, false)
					return
				}
			}
			
			this.lastShot = now

			let picture = "picture.jpg"
			
			// Door is open ? 
			let doorStatus = Tools.valueOf(global.config.self.devices, "status", "door")
			let brightness = this.options.brightness
			let contrast = this.options.contrast
			if(doorStatus === 2 && this.variations !== undefined) {
				brightness = this.variations.brightness !== undefined ? this.variations.brightness : brightness
				contrast = this.variations.contrast !== undefined ? this.variations.contrast : contrast
			}
			
			let args = {
				output: this.options.directory + picture,
				encoding: "jpg",
				width: this.options.width,
				height: this.options.height,
				brightness: brightness,
				contrast: contrast,
				quality: this.options.quality,
				rotation: this.options.rotation
			}

			LOG.device(this, `Shot arguments: ${JSON.stringify(args)}`)
			// /opt/vc/bin/raspistill --output test3.jpg --encoding jpg --width 720 --height 480 --brightness 60 --contrast 20 --quality 75 --rotation 180
			exec(`"/opt/vc/bin/raspistill" --output ${args.output} --encoding ${args.encoding} --width ${args.width} --height ${args.height} --brightness ${args.brightness} --contrast ${args.contrast} --quality ${args.quality} --rotation ${args.rotation}`, 
				(err, stdout, sterr) => {
					LOG.device(this, "Take a new shot...")
					if(err) LOG.device(this, err)
					this._lastShot(res, false)
				})
		})
	}

	/*_getPicture() {
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
				let contentType = 'image/jpeg'
				res.writeHeader(200, {
					'Content-Type': contentType
				})
				res.end(img, 'binary')
			})
		}
	}*/

	_getPictureB64() {
		this.router.get('/picture_64.jpg', (req, res) => {
			let now = new Date()
			if(this.lastShot !== undefined) {
				let uptime = new Date(this.lastShot.getTime() + 10000) // 10 seconds between 2 shots
				if(uptime > now) {
					LOG.device(this, "Send last shot...")
					this._lastShot(res, true)
					return
				}
			}
			
			this.lastShot = now

			let picture = "picture.jpg"
			
			// Door is open ? 
			let doorStatus = Tools.valueOf(global.config.self.devices, "status", "door")
			let brightness = this.options.brightness
			let contrast = this.options.contrast
			if(doorStatus === 2 && this.variations !== undefined) {
				brightness = this.variations.brightness !== undefined ? this.variations.brightness : brightness
				contrast = this.variations.contrast !== undefined ? this.variations.contrast : contrast
			}
			
			let args = {
				output: this.options.directory + picture,
				encoding: "jpg",
				width: this.options.width,
				height: this.options.height,
				brightness: brightness,
				contrast: contrast,
				quality: this.options.quality,
				rotation: this.options.rotation
			}

			LOG.device(this, `Shot arguments: ${JSON.stringify(args)}`)
			// /opt/vc/bin/raspistill --output test3.jpg --encoding jpg --width 720 --height 480 --brightness 60 --contrast 20 --quality 75 --rotation 180
			exec(`"/opt/vc/bin/raspistill" --output ${args.output} --encoding ${args.encoding} --width ${args.width} --height ${args.height} --brightness ${args.brightness} --contrast ${args.contrast} --quality ${args.quality} --rotation ${args.rotation}`, 
				(err, stdout, sterr) => {
					LOG.device(this, "Take a new shot...")
					if(err) LOG.device(this, err)
					this._lastShot(res, true)
				})
		})
	}

}

