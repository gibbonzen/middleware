const TypeMIME = {
	JSON: "application/json",
	JPG: "image/jpeg"
}

module.exports = class SimpleRoute {
	constructor(route) {
		this.path = "/"
		this.type = TypeMIME.JSON
		this.get = true
		this.post = true

		if(route !== undefined) {
			this.path = route.path !== undefined ? route.path : this.path
			this.type = route.type !== undefined ? TypeMIME[route.type] : this.type
			this.get = route.get !== undefined ? route.get : this.get
			this.post = route.post !== undefined ? route.post : this.post

		}
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