const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
	console.log('client on /camera')
	res.json({
		module: 'caméra'
	})
})

function test(socket, next) {
	socket.on('camera', (data) => {
		console.log('test camera') 
	})

	event.on('new', n => console.log(n))

	next()
}


module.exports = {
	router: router,
	//socket: test
}