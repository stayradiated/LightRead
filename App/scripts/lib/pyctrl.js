(function() {

	var INDICATOR = "!COMMAND!";
	
	window.py_ctrl = {
		send: function(params, callback) {
			var id = Math.random().toString();
			// console.time(id);
			requests[id] = callback;
			document.title = null;
			document.title = INDICATOR + JSON.stringify({
				id: id,
				command: params
			});
		},
		receive: function(id, reply) {
			// console.timeEnd(id);
			if (typeof (requests[id]) == 'function') {
				requests[id](reply);
				delete requests[id];
			}
		},
		web: {
			send: function(params, callback) {
				if (params.hasOwnProperty('sql')) {
					py_ctrl.db.transaction(function(tx) {
						tx.executeSql(params.sql, [], function(tx, rs) {
							var tmp_array = [];
							for(var i=0; i<rs.rows.length; i++) {
								var row = rs.rows.item(i);
								var index = tmp_array.length;
								tmp_array.push([]);
								for (var key in row) {
									tmp_array[index].push(row[key]);
								}
							}
							if (callback) callback(tmp_array);
						});
					});
				}
			}
		},
		use_web: function() {
			py_ctrl.db = openDatabase('lightread', '1.0', 'feeds and item storage', 5 * 1024 * 1024);
			py_ctrl.send = py_ctrl.web.send;
		}
	};
	var requests = py_ctrl.requests = {};

})();