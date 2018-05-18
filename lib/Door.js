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
		this.delay = 35000

		this.automate = {
			auto: false,
			hopen: undefined,
			hclose: undefined	
		}
		if(jsonBuffer.automate !== undefined) {
			this.automate.auto = jsonBuffer.automate.auto !== undefined ? jsonBuffer.automate.auto : false
			this.automate.hopen = jsonBuffer.automate.hopen !== undefined ? jsonBuffer.automate.hopen : undefined
			this.automate.hclose = jsonBuffer.automate.hclose !== undefined ? jsonBuffer.automate.hclose : undefined
		}

		this.pinOpen = new GPIO(20, 'out')
		this.pinOpen.writeSync(0)
		this.pinClose = new GPIO(21, 'out')
		this.pinClose.writeSync(0)

		this.tasks = {
			"open": null,
			"close": null
		}
		
		if(this.automate.auto) {
			let automate = this.automate
			if(automate.hopen !== undefined) {
				this.tasks.open = this.startTask(automate.hopen, this.open, automate.auto)
				if(this.tasks.open !== null) {
					console.log("Open tasks add")
				}
			}

			if(automate.hclose !== undefined) {
				this.tasks.close = this.startTask(automate.hclose, this.close, automate.auto)
				if(this.tasks.close !== null) {
					console.log("Close tasks add")
				}
			}
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

	open(self) {
		let response
		if(self.status === DoorStatus.OPENED || self.status === DoorStatus.OPENING) {
			response = "Action can't be executed !"
			LOG.device(self, response)
		}

		else {
			response = "Opening the door..."
			self._openDoor()
			LOG.device(self, response)
			self._updateStatus(DoorStatus.OPENING, true)

			setTimeout(() => {
				if(self.status === DoorStatus.STOPPED) return

				// Cut the power
				self._stopDoor()

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
			self._closeDoor()
			response = "Closing the door..."
			LOG.device(self,  response)
			self._updateStatus(DoorStatus.CLOSING, true)

			setTimeout(() => {
				if(self.status === DoorStatus.STOPPED) return

				// Cut the power
				self._stopDoor()

				response = "Door is closed"
				LOG.device(self, response)
				self._updateStatus(DoorStatus.CLOSED, true)

			}, self.delay)
		}
		return {"msg": response, "delay": self.delay}
	}

	stop(self) {
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
				if(settings.auto != undefined) 
					this.automate.auto = settings.auto
				if(settings.hopen !== undefined) 
					this.automate.hopen = settings.hopen
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

			let log = console.log
			
			let job = new CronJob(`00 ${minutes} ${hours} * * *`, 
//			return new CronJob('* * * * * *',
					() => log(action.name), 
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
		//this.startTask(this.automate.hopen, LOG.client).start()
		let openTask = this.startTask(this.automate.hopen, this.open, this.automate.auto)
		let closeTask = this.startTask(this.automate.hclose, this.close, this.automate.auto)

		if(this.tasks.open !== undefined) {
			console.log("--> Open task find")
			let task = this.tasks.open
			task.stop()
			task = undefined
		}

		if(this.tasks.close !== undefined) {
			console.log("--> Close task find")
			let task = this.tasks.close
			task.stop()
			task = undefined
		}
		
		this.tasks.open = openTask
		this.tasks.close = closeTask

		console.log("CronJobs in wait : %j", this.tasks)
	}


}
