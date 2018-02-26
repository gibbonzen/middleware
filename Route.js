module.exports = class Router {
	constructor(type) {
		const RouterImpl = require(`./${type}`)
		this.router = RouterImpl
	}

	router() {
		return this.router
	}
}