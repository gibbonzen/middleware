const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
	res.send('Module caméra')
})

module.exports = router