const Device = require('./Device')
const LOG = require('./LOG')
const Tools = require('./Tools')
const GPIO = require('onoff').Gpio
const CronJob = require('cron').CronJob

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
		this.delay = jsonBuffer.delay !== undefined ? jsonBuffer.delay : 35000

		this.pinOpen = new GPIO(20, 'out')
		this.pinOpen.writeSync(0)
		this.pinClose = new GPIO(21, 'out')
		this.pinClose.writeSync(0)
		this.isWaiting = true

		this.tasks = {
			"open": null,
			"close": null
		}
		
		this.automate = {
			auto: false,
			open: false,
			hopen: undefined,
			close: false,
			hclose: undefined	
		}
		if(jsonBuffer.automate !== undefined) {		
			this.automate.auto = jsonBuffer.automate.auto !== undefined ? jsonBuffer.automate.auto : false
			this.automate.open = jsonBuffer.automate.open !== undefined ? jsonBuffer.automate.open : false
			this.automate.hopen = jsonBuffer.automate.hopen !== undefined ? jsonBuffer.automate.hopen : undefined
			this.automate.close = jsonBuffer.automate.close !== undefined ? jsonBuffer.automate.close : false
			this.automate.hclose = jsonBuffer.automate.hclose !== undefined ? jsonBuffer.automate.hclose : undefined
			
			this.updateTask()
		}
	}

	toString() {
		let toString = {
			"name": this.name,
			"status": this.status, 
			"actions": this.actions,
			"automate": this.automate
		}
		return toString
	}

	doAfterAction(sens) {
		let response = "Door is closed"
		if(sens === DoorStatus.OPENED) {
			response = "Door is opened"
		}

		setTimeout(() => {
			if(this.status === DoorStatus.STOPPED || !this.isWaiting) return

			// Cut the power
			this._stopDoor()

			LOG.device(this, response)
			this._updateStatus(sens, true)
		}, this.delay)
	}

	open(self) {
		let response
		if(self.status === DoorStatus.OPENED || self.status === DoorStatus.OPENING) {
			response = "Action can't be executed !"
			LOG.device(self, response)
		}

		else {
			self._openDoor()
			self.isWaiting = true
			response = "Opening the door..."
			LOG.device(self, response)
			self._updateStatus(DoorStatus.OPENING, true)

			self.doAfterAction(DoorStatus.OPENED)
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
			self._closeDoor()
			self.isWaiting = true
			response = "Closing the door..."
			LOG.device(self,  response)
			self._updateStatus(DoorStatus.CLOSING, true)

			self.doAfterAction(DoorStatus.CLOSED)
		}

		return {"msg": response, "delay": self.delay}
	}

	stop(self) {
		self.isWaiting = false
		self._stopDoor()
		let response = "Door is stopped"
		LOG.device(self, response)
		self._updateStatus(DoorStatus.STOPPED, true)
		return {"msg": response, "delay": 10}
	}

	_updateStatus(newState, write) {
		this.status = newState
		if(write) {
			Tools.serialize(this)
		}
	}

	_openDoor() {
		this.pinOpen.writeSync(1)
		this.pinClose.writeSync(0)
	}

	_closeDoor() {
		this.pinOpen.writeSync(0)
		this.pinClose.writeSync(1)
	}
	_stopDoor() {
		this.pinOpen.writeSync(0)
		this.pinClose.writeSync(0)
	}

	_initRouter() {
		super._initRouter()
		LOG.device(this, 'Init specific routes')

		this.router.post('/settings', (req, res) => {
			LOG.device(this, "Update settings")

			let settings = req.body
			console.log("settings: %j", settings)

			if(settings !== undefined) {
				if(settings.auto !== undefined) 
					this.automate.auto = settings.auto
				if(settings.open !== undefined) 
					this.automate.open = settings.open
				if(settings.hopen !== undefined) 
					this.automate.hopen = settings.hopen
				if(settings.close !== undefined) 
					this.automate.close = settings.close
				if(settings.hclose !== undefined) 
					this.automate.hclose = settings.hclose
			}

			Tools.serialize(this)

			this.updateTask()

			res.setHeader('Content-Type', 'application/json')
			res.send(JSON.stringify(this.toString()))
		})

	}

	startTask(time, action, start) {	
		if(time !== undefined) {
			let hours = Tools.getHours(time)
			let minutes = Tools.getMinutes(time)
			
			let job = new CronJob(`00 ${minutes} ${hours} * * *`, 
					() => action(this), 
					() => {},
					false,
					'Europe/Paris')
			if(start) {
				job.start()
			}
			return job
		}
	}

	updateTask() {
		LOG.device(this, "Update cron jobs")
		let openTask = this.startTask(this.automate.hopen, this.open, this.automate.open)
		let closeTask = this.startTask(this.automate.hclose, this.close, this.automate.close)

		if(this.tasks.open !== null) {
			console.log("--> Open task update")
			let task = this.tasks.open
			task.stop()
			task = undefined
		}

		if(this.tasks.close !== null) {
			console.log("--> Close task update")
			let task = this.tasks.close
			task.stop()
			task = undefined
		}
		
		this.tasks.open = openTask
		this.tasks.close = closeTask
		
		console.log(`Automatic open at: ${this.automate.hopen} - ${this.automate.open}`)
		console.log(`Automatic close at: ${this.automate.hclose} - ${this.automate.close}`)
	}

}
