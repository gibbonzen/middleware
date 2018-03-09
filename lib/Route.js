function Router(type) {
	const RouterImpl = require(`./${type}`)
	return RouterImpl
}

module.exports = Router