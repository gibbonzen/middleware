const express = require('express')
const router = express.Router()

let doOnRegister = undefined
let doOnUnregister = undefined

function onRegister(callback) {
	doOnRegister = callback
}

function onUnregister(callback) {
	doOnUnregister = callback
}

router.post('/register', (req, res, next) => {
	doOnRegister(req, res)

	res.end()
	next()
})

router.post('/unregister', (req, res, next) => {
	doOnUnregister(req, res)

	res.end()
	next()
})

module.exports = {
	onRegister: onRegister,
	onUnregister: onUnregister,
	router: router
}