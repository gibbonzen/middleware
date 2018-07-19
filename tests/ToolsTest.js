const Tools = require('../lib/Tools')

/*
* valueOfTest
*/
function valueOfTest() {
	let devices = [
		{
			name: "Door",
			type: "door",
			status: 0
		},
		{
			name: "Caméra",
			type: "camera",
			status: 1
		}
	]
	
	let expectedDeviceAttribute = devices[0].status
	let searchDeviceAttribute = Tools.valueOf(devices, "status", "door")

	console.log(`Test <valueOfTest> ${searchDeviceAttribute === expectedDeviceAttribute ? "success" : "failed"}`)
	console.log(`Expected: ${expectedDeviceAttribute} - Find: ${searchDeviceAttribute}`)

}
valueOfTest()