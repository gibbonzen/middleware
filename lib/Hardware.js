const express = require('express')
const LOG = require('./LOG')
const LEVEL = LOG.LEVEL
const child_process = require('child_process')

module.exports = class Hardware {
	constructor(hardwareConf) {
		this.actions = {
			"reboot": this.reboot,
			"shutdown": this.shutdown
		}
		this.router = express.Router()
		this.initRouter()
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
			cmd = `./server_k_deamon.sh restart`
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
			cmd = 'shutdown now'
		}
		else {
			LOG.log(LEVEL.WARNING, "Try to shutdown")
			cmd = `./server_k_deamon.sh stop`
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

	initRouter() {
		this.router.post('/:action', (req, res) => {
			let action = req.params.action
			let hard = req.body.hard

			if(action === "shutdown") {
				this.shutdown(hard)
			}
			if(action === "reboot") {
				this.reboot(hard)
			}
			res.json({action:`Try to ${action}`})
		})
	}
}