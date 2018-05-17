const Device = require('./Device')
const LOG = require('./LOG')
const Tools = require('./Tools')

const DoorStatus = {
	CLOSED: 0x00, CLOSING: 0x01,
	OPENED: 0x02, OPENING: 0X04,
	STOPPED: 0X05
};

module.exports = class Door extends Device {
	constructor(jsonBuffer) {
		super(jsonBuffer);
		this.actions = {
			"open": this.open,
			"close": this.close,
			"stop": this.stop
		}
		this.delay = 30000
		this.hopen = jsonBuffer.hopen !== undefined ? jsonBuffer.hopen : null
		this.hclose = jsonBuffer.hclose !== undefined ? jsonBuffer.hclose : null
	}

	open(self) {
		let response
		if(self.status === DoorStatus.OPENED || self.status === DoorStatus.OPENING) {
			response = "Action can't be executed !"
			LOG.device(self, response)
		}

		else {
			response = "Opening the door..."
			//self.connection.on();
			LOG.device(self, response)
			self._updateStatus(DoorStatus.OPENING, true)

			setTimeout(() => {
				response = "Door is opened"
				LOG.device(self, response)
				self._updateStatus(DoorStatus.OPENED, true)

			}, self.delay)
		}

		return {"msg": response, "delay": self.delay}
	}
	close(self) {
		let response
		if(self.status === DoorStatus.CLOSED || self.status === DoorStatus.CLOSING) {
			response = "Action can't be executed !"
			LOG.device(self, response)
		}

		else {
			//self.connection.off();
			response = "Closing the door..."
			LOG.device(self,  response)
			self._updateStatus(DoorStatus.CLOSING, true)

			setTimeout(() => {
				response = "Door is opened"
				LOG.device(self, response)
				self._updateStatus(DoorStatus.CLOSED, true)

			}, self.delay)
		}
		return {"msg": response, "delay": self.delay}
	}

	/*stop(self) {
		LOG.device(self, "Door is stopped")
		self._updateStatus(DoorStatus.STOPPED, true)
	}*/

	_updateStatus(newState, write) {
		this.status = newState
		if(write) {
			Tools.serialize(this)
		}
	}
	
	_initRouter() {
		super._initRouter()
		LOG.device(this, 'Init specific routes')

		this.router.post('/settings', (req, res) => {
			let settings = req.body
			if(settings !== undefined) {
				if(settings.hopen !== undefined) 
					this.hopen = settings.hopen
				if(settings.hclose !== undefined) 
					this.hclose = settings.hclose
			}

			res.setHeader('Content-Type', rootRoute.type)
			res.send(JSON.stringify(this.toString()))
		})

	}

}
