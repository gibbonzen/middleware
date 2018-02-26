const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
	res.send('Module température')
})

module.exports = router