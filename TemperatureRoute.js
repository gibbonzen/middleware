const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
	res.json({
		module: 'température'
	})
})


function test(socket) {
	console.log('test température')
}

module.exports = {
	router: router
}