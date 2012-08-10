/*jshint asi: true*/

(function() {

	var readable = window.readable = {}

	var OAUTH_URL = 'https://www.readability.com/api/rest/v1/oauth/access_token/'

	var consumer_key = 'stayradiated',
		consumer_secret = 'KBVFkZnaZbCkQxNhdg7tbVYPBpF8sc5L',
		x_auth_username = 'stayradiated',
		x_auth_password = '2mqmJgU8yvECxp',
		x_auth_mode = 'client_auth'

	var request = new XMLHttpRequest()
	request.open('POST', OAUTH_URL, true)
	request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
	request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')

})()