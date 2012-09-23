/*jshint asi: true*/
(function() {

	// Simple SQL replacement
	var db = {
		// db.create('feeds', 'key text, value text');
		create: function(table, columns) {
			py_ctrl.send({
				sql: "CREATE TABLE IF NOT EXISTS " + table + " (" + columns + ")"
			});
		},
		// db.drop('feeds');
		drop: function(table) {
			py_ctrl.send({
				sql: "DROP TABLE " + table
			});
		},
		// db.select('feeds', function(){});
		select: function(table, callback) {
			py_ctrl.send({
				sql: "SELECT * FROM " + table
			}, callback);
		},
		// db.insert('feeds', {column1: 'value1', column2: 'value2'});
		insert: function(table, data) {
			var formattedData = this._formatData(data);

			py_ctrl.send({
				sql: "INSERT INTO " + table + " (" + formattedData.columns + ") VALUES (" + formattedData.values + ")"
			});
		},
		// db.upsert('feeds', {column1: 'value1', column2: 'value2'});
		upsert: function(table, data) {
			var formattedData = this._formatData(data);

			py_ctrl.send({
				sql: "REPLACE INTO " + table + " (" + formattedData.columns + ") VALUES (" + formattedData.values + ")"
			});
		},
		// db.empty('feeds')
		empty: function(table) {
			py_ctrl.send({
				sql: "DELETE FROM " + table
			});
		},
		_formatData: function(data) {
			// Remove all the apostrophes
			data.value = data.value.replace(/'/g, "&#39;")

			// Split the object into two strings
			var columns = [];
			var values = [];
			for (var key in data) {
				if (data.hasOwnProperty(key)) {
					columns.push(key);
					values.push("'" + data[key] + "'");
				}
			}
			// Transform into comma-delimited strings
			columns = columns.join(",");
			values = values.join(",");

			return {"columns": columns, "values": values};
		}
	};

	// Load from localStorage
	window.storage = {
		feeds: [],
		items: {},
		load: function(callback) {
			db.select('feeds', function(results) {
				var len = results.length, i
				for (i = 0; i < len; i++) {
					storage.feeds.push(JSON.parse(results[i][1]))
				}
			});
			db.select('items', function(results) {
				var len = results.length, i, row
				for (i = 0; i < len; i++) {
					row = results[i]
					storage.items[row[0]] = JSON.parse(row[1])
				}
				if (callback) callback();
			});
		},
		loadAuth: function(callback) {
			db.select('user', function(results) {
				var len = results.length;
				var i, row;
				for (i = 0; i < len; i++) {
					row = results[i];
					switch(row[0]) {
						case 'user':
							localStorage.User = row[1]
							break
						case 'auth':
							localStorage.Auth = row[1]
							break
						case 'sync':
							sync = JSON.parse(row[1])
							break
						case 'settings':
							saved_settings = JSON.parse(row[1])
							settings = default_settings()

							for (var key in settings) {
								if (saved_settings.hasOwnProperty(key)) {
									settings[key] = saved_settings[key]
								}
							}

							break

						case 'pocket':
							core.pocket.user = JSON.parse(row[1])
							core.pocket.user.loggedIn = true
							break

						case 'instapaper':
							core.instapaper.user = JSON.parse(row[1])
							core.instapaper.user.loggedIn = true
							break
					}
				}

				if (callback) callback();
			});
			db.select('icons', function(results) {
				var len = results.length, i, row
				for (i = 0; i < len; i++) {
					row = results[i];
					localStorage['icon-' + row[0]] = row[1]
				}
			});
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
			console.log("Saving feeds");

			db.empty('feeds');
			db.empty('items');

			var i, key, value
			for(i = 0; i < storage.feeds.length; i++) {
				value = JSON.stringify(storage.feeds[i]);
				db.insert('feeds', {key: i, value: value});
			}

			for(key in storage.items) {
				value = JSON.stringify(storage.items[key]);
				db.insert('items', {key: key, value: value});
			}
		},
		setUser: function(user) {
			db.insert('user', {key: 'user', value: user});
		},
		setAuth: function(auth) {
			db.insert('user', {key: 'auth', value: auth});
		},
		savePrefs: function() {
			db.upsert('user', {key: 'sync', value: JSON.stringify(sync)});
			db.upsert('user', {key: 'settings', value: JSON.stringify(settings)});
			db.upsert('user', {key: 'pocket', value: JSON.stringify(core.pocket.user)});
			db.upsert('user', {key: 'instapaper', value: JSON.stringify(core.instapaper.user)});
			python('settings', JSON.stringify(settings));
		},
		saveIcons: function() {
			db.empty('icons');
			for (var key in localStorage) {
				if (_.string.startsWith(key, 'icon-')) {
					db.insert('icons', {key: key.substr(5), value: localStorage[key]});
				}
			}
		},
		init: function() {
			db.create('feeds', 'key text, value text');
			db.create('items', 'key text, value text');
			db.create('user', 'key text unique, value text');
			db.create('icons', 'key text, value text');
		},
		flush: function() {
			localStorage.clear();
			core.pocket.logout();
			core.instapaper.logout();
			db.drop('feeds');
			db.drop('items');
			db.drop('user');
			db.drop('icons');
			storage.init();
			ui.reload();
		}
	}

	storage.init();

})();