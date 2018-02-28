$(function($) {

	let result
	get('camera', result)

})

function get(path, result) {
	$.ajax({
		type: 'GET',
		dataType: 'json',
		contentType: 'application/json',
		url: 'http://localhost:8081/' + path,
		success: function (data) {
			result = data
		}
	})
	return result;
}