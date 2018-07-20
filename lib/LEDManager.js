let Tools = require('./Tools')
let GPIO = Tools.use('onoff', 'Gpio', function(num, way) {
	this.num = num
	this.way = way
	this.enable = undefined

	this.readSync = (enable) => {
		this.enable = enable
		if(this.way === "out") {
			console.log(`ERROR: This LED is in mode "${this.way}"`)
		}
	}

	this.writeSync = (enable) => {
		if(this.way === "out") {
			this.enable = enable

			if(!enable) {
				console.log(`PIN ${this.num} activate LOW mode`)
			}
			if(enable) {
				console.log(`PIN ${this.num} activate HIGH mode`)
			}
		}
		else {
			console.log(`ERROR: This LED is in mode "${this.way}"`)
		}
	}
})

const LED = {
	PWR:32,
	ACT:47,
	USB:38,
	CAM:40
}

class LEDManager {
	constructor(leds) {
		this.pwr = new GPIO(LED.PWR, 'out')
		this.setActive(this.pwr, leds.pwr)
		this.act = new GPIO(LED.ACT, 'out')
		this.setActive(this.act, leds.act)
		this.usb = new GPIO(LED.USB, 'out')
		this.setActive(this.usb, leds.usb)
		this.cam = new GPIO(LED.CAM, 'out')
		this.setActive(this.cam, leds.cam)
	}

	setActive(led, enable = false) {
		led.writeSync(enable)
	}

}

module.exports = {
	LED: LED,
	LEDManager: LEDManager
}