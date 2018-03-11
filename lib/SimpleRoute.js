const TypeMIME = {
	JSON: "application/json",
	JPG: "image/jpeg"
}

module.exports = class SimpleRoute {
	constructor(route) {
		this.path = "/" || route.path
		this.type = TypeMIME.JSON || TypeMIME[route.type]
		this.get = true || route.get
		this.post = true || route.post
	}

	getPath() {
		return this.path
	}

	getType() {
		return this.type
	}

	acceptGET() {
		return this.post
	}

	acceptPOST() {
		return this.post
	}

	equals(route) {
		if(this.path === route.getPath() && 
			this.type === route.getType() && 
			this.get === route.acceptPOST() && 
			this.post === route.acceptGET()) {
			return true
		}
		return false
	}
}