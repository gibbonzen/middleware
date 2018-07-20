const express = require('express')
const LOG = require('./LOG')
const LEVEL = LOG.LEVEL
const child_process = require('child_process')
const { LEDManager } = require('./LEDManager')

module.exports = class Hardware {
	constructor(hardwareConf) {
		this.actions = {
			"start": this.start,
			"reboot": this.reboot,
			"shutdown": this.shutdown
		}

		this.logName = "ps"
		this.pid = undefined

		let cmd = `ps -ef | grep '${this.logName}' | awk '{printf $2}'`
		this.execute(cmd, null, (pid) => {
			this.pid = pid
			console.log(this.pid)
		})

		// LED MODULE
		//this.ledManager = new LEDManager(hardwareConf.leds)
	}

	start() {
		LOG.log(LEVEL.WARNING, "Try to start")
	}

	/*
	* param boolean @hard for raspberry reboot
	*/
	reboot(hard) {
		let cmd = undefined
		if(hard) {
			LOG.log(LEVEL.WARNING, "Try to reboot hard")
			cmd = `shutdown -r now`
		}
		else {
			LOG.log(LEVEL.WARNING, "Try to reboot server")
			if(this.pid !== undefined) {
				cmd = `path/to/init.d reload`
			}
		}
		this.execute(cmd)
	}

	/*
	* param boolean @hard for raspberry shutdown
	*/
	shutdown(hard) {
		let cmd = undefined
		if(hard) {
			LOG.log(LEVEL.WARNING, "Try to shutdown hard")
		}
		else {
			LOG.log(LEVEL.WARNING, "Try to shutdown")
			if(this.pid !== undefined) {
				cmd = `kill -9 ${this.pid}`
			}
		}
		this.execute(cmd)
	}

	execute(cmd, args, next) {
		child_process.exec(cmd, args, (e, out, err) => {
			if(next) {
				next(out)
			}
		})
	}
}