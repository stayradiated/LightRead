/*jshint asi: true*/

// Load from localStorage
window.storage = {
	feeds: [],
	items: {},
	load: function(callback) {
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM feeds', [], function (tx, results) {
				var len = results.rows.length, i
				for (i = 0; i < len; i++) {
					storage.feeds.push(JSON.parse(results.rows.item(i).value))
				}
			})
			tx.executeSql('SELECT * FROM items', [], function (tx, results) {
				var len = results.rows.length, i, row
				for (i = 0; i < len; i++) {
					row = results.rows.item(i)
					storage.items[row.key] = JSON.parse(row.value)
				}
				callback()
			})
		})
	},
	loadAuth: function(callback) {
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM user', [], function (tx, results) {
				var len = results.rows.length, i, row
				for (i = 0; i < len; i++) {
					row = results.rows.item(i)
					switch(row.key) {
						case 'user':
							localStorage.User = row.value
							break
						case 'auth':
							localStorage.Auth = row.value
							break
						case 'sync':
							sync = JSON.parse(row.value)
							break
						case 'settings':
							saved_settings = JSON.parse(row.value)
							settings = default_settings()

							for (var key in settings) {
								if (saved_settings.hasOwnProperty(key)) {
									settings[key] = saved_settings[key]
								}
							}

							break

						case 'pocket':
							core.pocket.user = JSON.parse(row.value)
							core.pocket.user.loggedIn = true
							break

						case 'instapaper':
							core.instapaper.user = JSON.parse(row.value)
							core.instapaper.user.loggedIn = true
							break
					}
				}
				if (callback) callback()
			})
			tx.executeSql('SELECT * FROM icons', [], function (tx, results) {
				var len = results.rows.length, i, row
				for (i = 0; i < len; i++) {
					row = results.rows.item(i)
					localStorage['icon-' + row.key] = row.value
				}
			})
		})
	},
	pending: false,
	requestSave: function() {
		if(storage.pending === false) {
			storage.pending = setTimeout(storage.save, 1000)
		} else {
			clearTimeout(storage.pending)
			storage.pending = false
			storage.requestSave()
		}
	},
	save: function() {
		console.log("Saving feeds")
		db.transaction(function(tx) {
			tx.executeSql('DELETE FROM feeds')
			tx.executeSql('DELETE FROM items')
		})
		db.transaction(function(tx) {
			var i, value
			for(i = 0; i < storage.feeds.length; i++) {
				value = JSON.stringify(storage.feeds[i])
				tx.executeSql('INSERT INTO feeds (key, value) VALUES (?, ?)', [i, value])
			}
		})
		db.transaction(function(tx) {
			var key, value
			for(key in storage.items) {
				value = JSON.stringify(storage.items[key])
				tx.executeSql('INSERT INTO items (key, value) VALUES (?, ?)', [key, value])
			}
		})
	},
	setUser: function(user) {
		db.transaction(function(tx) {
			tx.executeSql('INSERT INTO user (key, value) VALUES (?, ?)', ['user', user])
		})
	},
	setAuth: function(auth) {
		db.transaction(function(tx) {
			tx.executeSql('INSERT INTO user (key, value) VALUES (?, ?)', ['auth', auth])
		})
	},
	savePrefs: function() {
		db.transaction(function(tx) {
			tx.executeSql('INSERT INTO user (key, value) VALUES (?, ?)', ['sync', JSON.stringify(sync)])
			tx.executeSql('INSERT INTO user (key, value) VALUES (?, ?)', ['settings', JSON.stringify(settings)])
			tx.executeSql('INSERT INTO user (key, value) VALUES (?, ?)', ['pocket', JSON.stringify(core.pocket.user)])
			tx.executeSql('INSERT INTO user (key, value) VALUES (?, ?)', ['instapaper', JSON.stringify(core.instapaper.user)])
		})
	},
	saveIcons: function() {
		db.transaction(function(tx) {
			tx.executeSql('DELETE FROM icons')
			for (var key in localStorage) {
				if (_.string.startsWith(key, 'icon-')) {
					tx.executeSql('INSERT INTO icons (key, value) VALUES (?, ?)', [key.substr(5), localStorage[key]])
				}
			}
		})
	},
	init: function() {
		db = openDatabase('lightread', '1.0', 'feeds and item storage', 5 * 1024 * 1024)
		db.transaction(function(tx) {
			tx.executeSql('CREATE TABLE IF NOT EXISTS feeds (key text, value text)')
			tx.executeSql('CREATE TABLE IF NOT EXISTS items (key text, value text)')
			tx.executeSql('CREATE TABLE IF NOT EXISTS user (key text, value text)')
			tx.executeSql('CREATE TABLE IF NOT EXISTS icons (key text, value text)')
		})
	},
	flush: function() {
		localStorage.clear()
		core.pocket.logout()
		core.instapaper.logout()
		db.transaction(function(tx) {
			tx.executeSql('DROP TABLE feeds')
			tx.executeSql('DROP TABLE items')
			tx.executeSql('DROP TABLE user')
			tx.executeSql('DROP TABLE icons')
			storage.init()
			ui.reload()
		})
	}
}

var db
storage.init()