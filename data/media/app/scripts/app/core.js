
/*jshint asi: true*/

// Core functions
core = {

	// *************************************
	// *
	// * Useful utilities
	// *
	// *************************************

	// Convert a timestamp into a date string -- "10/6/2012"
	date: function(timestamp) {
		if(timestamp.length > 13) timestamp = Number(timestamp.substr(0,13))
		var date = new Date(timestamp),
			day = date.getDate(),
			month = date.getMonth() + 1,
			year = date.getFullYear()
		return date + "/" + month + "/" + year
	},

	urlencode: function(clearString) {
		var output = '';
		var x = 0;
		clearString = clearString.toString();
		var regex = /(^[a-zA-Z0-9_.]*)/;
		while (x < clearString.length) {
			var match = regex.exec(clearString.substr(x));
			if (match != null && match.length > 1 && match[1] != '') {
				output += match[1];
					x += match[1].length;
				} else {
				if (clearString[x] == ' ') {
					output += '+';
				} else {
					var charCode = clearString.charCodeAt(x);
					var hexVal = charCode.toString(16);
				output += '%' + ( hexVal.length < 2 ? '0' : '' ) + hexVal.toUpperCase();
				}
			x++;
			}
		}
		return output;
	},

	// Convert a timestamp into a time string -- "2:15 PM"
	time: function(timestamp) {
		if(timestamp.toString().length > 13) timestamp = Number(timestamp.substr(0,13))
		if(timestamp.toString().length < 13) timestamp = Number(timestamp) * 1000
		var date = new Date(timestamp), hours, minutes, ampm = "AM"

		// Hours
		hours = date.getHours()
		if (hours > 12) {
			hours -= 12
			ampm = "PM"
		} else if (hours === 0) {
			hours = 12
		}

		// Minutes
		minutes = date.getMinutes()
		if (minutes < 10) minutes = "0" + minutes

		// Formatting
		return hours + ":" + minutes + " " + ampm
	},

	// Convert a timestamp into a date and time string -- "Friday, 8th June 2012"
	longDate: function(timestamp) {
		if(timestamp.toString().length > 13) timestamp = Number(timestamp.substr(0,13))
		if(timestamp.toString().length < 13) timestamp = Number(timestamp) * 1000
		var date = new Date(timestamp),
			days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			day = date.getDate().toString()

		if (day.slice(-1) == 1 && (day.length == 1 || day.slice(-2, 1) != 1)) day += "st"
		else if (day.slice(-1) == 2 && (day.length == 1 || day.slice(-2, 1) != 1)) day += "nd"
		else if (day.slice(-1) == 3 && (day.length == 1 || day.slice(-2, 1) != 1)) day += "rd"
		else day += "th"

		var out = {
			day: days[date.getDay()] + ", ",
			date: day + " ",
			month: months[date.getMonth()] + " ",
			year: date.getFullYear()
		}

		return out.day.concat(out.date, out.month, out.year)
	},

	// Gets the unix timestamp of when items will be removed
	getExpirationDate: function(type) {
		type = type || 'read'
		if (settings.keep[type] < 0) {
			return 0
		} else {
			var timestamp = settings.keep[type] * 86400000
			return Math.floor((Date.now() - timestamp) / 1000)
		}
	},


	// Group by day
	// Takes an array of items
	// Returns an array
	// >>> [item1, item2, item3, item4]
	// [['Thursday, 5th July 2012', [item1, item2]],
	//  ['Tuesday, 3rd July 2012', [item3, item4]]]
	groupByDay: function(items) {

		var day, item, i,
			id = 0,
			lastDay = 0,
			results = []

		for (i = 0; i < items.length; i++) {
			item = items[i]

			// Get number of days since 1970
			day = Math.round(item.published / 86400)

			if(day != lastDay) {
				id = results.length
				results[id] = [
					core.longDate(item.published),
					[item]
				]
			} else {
				results[id][1].push(item)
			}

			lastDay = day

		}

		return results

	},




	// *************************************
	// *
	// * Getting content and snippet of item
	// *
	// *************************************

	// Get the first n words of a string
	// Used in the article description
	snippet: function(item, n) {
		n = n || 100
		var content = core.content(item)
		return _.string.stripTags(content).split(' ', n).join(' ')
	},

	// Get the content of a post
	content: function(item) {
		var content = item.content || item.summary || {content: "No feed content"}
		return content.content
	},

	// Set the content of a post
	setContent: function(item, content) {
		if(item.hasOwnProperty('content')) {
			item.content = content
		} else {
			item.summary = content
		}
	},




	// *************************************
	// *
	// * Items
	// *
	// *************************************

	// Give it an array
	// Returns a string
	// 0 - "No items"
	// 1 - "1 item'
	// 2 - "2 items"
	getItemCount: function(items) {
		if (items.length) {
			var length =  items.length.toString()
			return length.concat(items.length > 1 ? ' items' : ' item')
		} else {
			return "No items"
		}
	},

	// Filter an array of items
	filterItems: function(items, filter) {
		return items.filter(function(element) {
			switch(filter) {
				case 'all':
					return true
					break
				case 'unread':
					return !element.isRead
					break
				case 'starred':
					return element.isStarred
					break
				case 'fresh':
					return core.isFresh(element)
			}
			return true
		})
	},

	// Pass it an item
	// Returns true or false
	isFresh: function(item) {

		if (
			!item.isRead &&
			item.published >= core.getExpirationDate('unread')
		) {
			return true
		}

		if (
			item.isStarred &&
			item.published >= core.getExpirationDate('starred')
		) {
			return true
		}

		return item.published >= core.getExpirationDate('read')
	},

	// Goes through all items in the storage
	// Removes any expired items
	removeOldItems: function() {
		for (var feed in storage.items) {
			storage.items[feed] = core.filterItems(storage.items[feed], 'fresh')
		}
		storage.requestSave()
	},

	// A very useful function
	// Can get items in a feed, label or even a filter
	getItemsInFeed: function(feed) {
		var results = [], i, j, subfeed, item

		switch(feed) {
		case 'all':
			var feeds = core.allFeeds()
			for (i = 0; i < feeds.length; i++) {
				feed = feeds[i]
				if(storage.items.hasOwnProperty(feed.id)) {
					for (j = 0; j < storage.items[feed.id].length; j++) {
						item = storage.items[feed.id][j]
						results.push(item)
					}
				}
			}
			break

		case 'unread':
			return core.filterItems(core.getItemsInFeed('all'), 'unread')
			break

		case 'starred':
			return core.filterItems(core.getItemsInFeed('all'), 'starred')
			break

		default:
			if(feed.feeds && feed.feeds.length > 0) {
				for (i = 0; i < feed.feeds.length; i++) {
					subfeed = feed.feeds[i]
					if (storage.items.hasOwnProperty(subfeed.id)) {
						for (j = 0; j < storage.items[subfeed.id].length; j++) {
							results.push(storage.items[subfeed.id][j])
						}
					}
				}
			} else {
				if (storage.items.hasOwnProperty(feed.id)) {
					for (i = 0; i < storage.items[feed.id].length; i++) {
						results.push(storage.items[feed.id][i])
					}
				}
			}
			break
		}

		return core.sortItems(results)
	},



	// *************************************
	// *
	// * Feeds
	// *
	// *************************************

	// Returns an array of all feeds, including those in labels
	allFeeds: function() {
		var results = []
		for (var i = 0; i < storage.feeds.length; i++) {
			var feed = storage.feeds[i]
			if(feed.isFeed) {
				results.push(feed)
			} else if (feed.isLabel) {
				for (var j = 0; j < feed.feeds.length; j++) {
					results.push(feed.feeds[j])
				}
			}
		}
		return results
	},

	// A clone of getStarredFeeds
	getUnreadFeeds: function() {
		var results = [], subfeedResults = [], id, item, feed, subfeed, i, j, k
		for (i = 0; i < storage.feeds.length; i++) {
			feed = storage.feeds[i]

			if(feed.isLabel) {

				subfeedResults = []
				
				for (j = 0; j < feed.feeds.length; j++) {

					subfeed = feed.feeds[j]

					for (k = 0; k < storage.items[subfeed.id].length; k++) {

						item = storage.items[subfeed.id][k]

						if(
							!item.isRead &&
							subfeedResults.indexOf(subfeed) == -1
						) {
							subfeedResults.push(subfeed)
						}
					}

				}

				if(subfeedResults.length) {
					id = results.length
					results[id] = {
						id: feed.id,
						title: feed.title,
						count: feed.count,
						isLabel: true,
						feeds: subfeedResults
					}
				}

			} else if(feed.isFeed) {
				for (j = 0; j < storage.items[feed.id].length; j++) {
					item = storage.items[feed.id][j]
					if(!item.isRead && results.indexOf(feed) == -1) {
						results.push(feed)
					}
				}
			}
		}
		return results
	},

	// Gets all feeds that have a starred item in them
	getStarredFeeds: function() {
		var results = [], subfeedResults = [], id, item, feed, subfeed, i, j, k
		for (i = 0; i < storage.feeds.length; i++) {
			feed = storage.feeds[i]

			if(feed.isLabel) {

				subfeedResults = []
				
				for (j = 0; j < feed.feeds.length; j++) {

					subfeed = feed.feeds[j]

					for (k = 0; k < storage.items[subfeed.id].length; k++) {

						item = storage.items[subfeed.id][k]

						if(
							item.isStarred &&
							subfeedResults.indexOf(subfeed) == -1
						) {
							subfeedResults.push(subfeed)
						}
					}

				}

				if(subfeedResults.length) {
					id = results.length
					results[id] = {
						id: feed.id,
						title: feed.title,
						count: feed.count,
						isLabel: true,
						feeds: subfeedResults
					}
				}

			} else if(feed.isFeed) {
				for (j = 0; j < storage.items[feed.id].length; j++) {
					item = storage.items[feed.id][j]
					if(item.isStarred && results.indexOf(feed) == -1) {
						results.push(feed)
					}
				}
			}
		}
		return results
	},

	// Get starred count of a feed
	// Only works on feeds and labels
	// feed must be a feed object and not an id
	getStarredCount: function(feed) {
		var count = 0,
			items = core.getItemsInFeed(feed)
		for (var i = 0; i < items.length; i++) {
			var item = items[i]
			if (item.isStarred) {
				count++
			}
		}
		return count
	},
	getUnreadCount: function(feed) {
		var count = 0,
			items = core.getItemsInFeed(feed)
		for (var i = 0; i < items.length; i++) {
			var item = items[i]
			if (!item.isRead) {
				count++
			}
		}
		return count
	},





	// *************************************
	// *
	// * Get an object by ID
	// *
	// *************************************

	// Get feed object by ID
	getFeed: function(id) {
		var feeds
		if(_.string.startsWith(id, 'user/-/')) {
			feeds = storage.feeds
		} else {
			feeds = core.allFeeds()
		}
		for (var i = 0; i < feeds.length; i++) {
			if (feeds[i].id == id) {
				return feeds[i]
			}
		}
		return false
	},

	// Get item object by ID
	getItem: function(id) {

		var i, j, item, feed,
			feeds = core.allFeeds()

		for (i = 0; i < feeds.length; i++) {
			feed = feeds[i]
			if (storage.items.hasOwnProperty(feed.id)) {
				for(j = 0; j < storage.items[feed.id].length; j++) {
					item = storage.items[feed.id][j]
					if(item.id == id) {
						return item
					}
				}
			}
		}

		return false

		// isLabel
		/*if (feed.feeds && feed.feeds.length > 0) {
			for (i = 0; i < feed.feeds.length; i++) {
				for (j = 0; j < storage.items[feed.feeds[i].id].length; j++) {
					if (storage.items[feed.feeds[i].id][j].id == id) {
						return storage.items[feed.feeds[i].id][j]
					}
				}
			}
		} else {
			for (i = 0; i < storage.items[feed.id].length; i++) {
				if (storage.items[feed.id][i].id == id) {
					return storage.items[feed.id][i]
				}
			}
		}*/
	},




	// *************************************
	// *
	// * Sorting stuff
	// *
	// *************************************

	// Sort items by date
	sortItems: function(items) {
		return items.sort(function(a,b) {
			return b.published - a.published
		})
	},

	// Sort an array of feeds by title
	// Places labels at front
	sortFeeds: function(feeds) {
		return feeds.sort(function(a,b) {
			if (a.isLabel && !b.isLabel) return -1
			else if (!a.isLabel && b.isLabel) return 1
			else if (a.isLabel && b.isLabel) return 0
			return a.title.toLowerCase().localeCompare(b.title.toLowerCase())
		})
	},




	// *************************************
	// *
	// * Loading Items
	// *
	// *************************************

	// Preload feeds
	// By default it loads all items.
	// feed {feed object} -- Optional. Only loads items in that feed.
	loadedItems: 0,
	unloadedItems: 0,
	onComplete: undefined,
	loadItems: function(feed, callback) {

		core.onComplete = callback || function() {}

		// Load items in all feeds
		if(typeof(feed) === 'undefined') {

			// All unread items
			reader.getItems(reader.TAGS['reading-list'], core.saveItems, {
				n: settings.max.special,
				ot: core.getExpirationDate('unread'),
				xt: reader.TAGS.read
			})
			reader.getItems(reader.TAGS['kept-unread'], core.saveItems, {
				n: settings.max.special,
				ot: core.getExpirationDate('unread')
			})

			// All starred items
			reader.getItems(reader.TAGS.star, core.saveItems, {
				n: settings.max.special,
				ot: core.getExpirationDate('starred')
			})

			// 5 items that aren't unread or starred
			/*reader.getItems(reader.TAGS.read, core.saveItems, {
				ot: core.getExpirationDate(),
				n: 5,
				xt: reader.TAGS.star
			})*/

			var i,
				feeds = core.allFeeds(),
				length = feeds.length

			core.unloadedItems = length + 3

			for (i = 0; i < feeds.length; i++) {
				if (!storage.items.hasOwnProperty(feeds[i].id)) {
					storage.items[feeds[i].id] = []
				}
				reader.getItems(feeds[i].id, core.saveItems, {
					xt: reader.TAGS.star,
					n: settings.max.read,
					ot: core.getExpirationDate('read')
				})
			}
		
		// Load items in that feed
		} else {
			core.unloadedItems = 1
			reader.getItems(feed.id, core.saveItems, {
				ot: core.getExpirationDate('read'),
				n: settings.max.read
			})
		}
		
	},

	// Save item
	saveItems: function(feedUrl, data) {

		var i, j

		for (i = 0; i < data.length; i++) {
			var feed = data[i].origin.streamId,
				old = core.getItem(data[i].id),
				isRead = false,
				isKeptUnread = false

			for(j = 0; j < data[i].categories.length; j++) {

				var cat = data[i].categories[j]

				// Read
				if (_.string.endsWith(cat,
						"state/com.google/read")) {
					isRead = true
				}

				// Kept Unread
				if (_.string.endsWith(cat,
						"state/com.google/kept-unread")) {
					isKeptUnread = true
				}

				// Starred
				if (_.string.endsWith(cat,
						"state/com.google/starred"
					)) {
					data[i].isStarred = true
				}
			}

			if (isRead && !isKeptUnread) {
				data[i].isRead = true
			}

			if (old) {
				var key
				for (key in old) {
					delete old[key]
				}
				for(key in data[i]) {
					old[key] = data[i][key]
				}
			} else {
				if (!storage.items.hasOwnProperty(feed)) {
					storage.items[feed] = []
				}
				storage.items[feed].push(data[i])
			}

		}

		core.loadedItems++
		core.onComplete(Math.round(core.loadedItems/core.unloadedItems*100))
		if (core.loadedItems == core.unloadedItems) core.loadedItems = 0

		storage.requestSave()
	},

	// Load feeds
	loadFeeds: function(callback) {
		reader.loadFeeds(function(data){
			console.log("Loading feeds")
			storage.feeds = core.sortFeeds(data)
			if (callback) callback()
		})
	},

	// Load all the items in a label, in order by timestamp
	loadLabel: function(label) {
		if(label.feeds) {
			var feed, items = []
			for (var i = 0; i < label.feeds.length; i++) {
				feed = label.feeds[i].id
				for (var j = 0; j < storage.items[feed].length; j++) {
					items.push(storage.items[feed][j])
				}
			}
			return core.sortItems(items)
		}
	},



	// *************************************
	// *
	// * Editing Items
	// *
	// *************************************

	// this is a function so we can reduce the amount of ajax calls when setting
	// an article as read. Just manually decrement the counts, don't request new
	// numbers.
	editUnreadCount: function(feedId, int, callback) {
		int = int || -1

		var editFeed = function(feed) {
			if (feed.count) feed.count += int
			else feed.count = 0 + int
			if (feed.count < 0) delete feed.count
		}

		_.each(storage.feeds, function(subscription) {
			if(subscription.id === feedId || (subscription.isAll)) {
				editFeed(subscription)
			} else if(subscription.feeds && subscription.feeds.length > 0) {
				_.each(subscription.feeds, function(feed) {
					if(feed.id === feedId) {
						editFeed(subscription)
						editFeed(feed)
					}
				})
			}
		})

		storage.requestSave()
		callback()
	},

	// Mark all read
	markAllAsRead: function(feed) {

		// Mark all as read
		for (var i = 0; i < selected.itemsArray.length; i++) {
			var item = selected.itemsArray[i]
			item.isRead = true
			for (var j = 0; j < item.categories.length; j++) {
				var cat = item.categories[j]
				if (_.string.endsWith(cat, 'state/com.google/kept-unread')) {
					core.addChange('item', item, 'kept-unread', false)
				}
			}
		}

		// Update view
		ui.markAllAsRead()
		ui.updateFilters()
		ui.filterFeeds(selected.filter)

		if (feed == 'all' || feed == 'unread') {
			feed = reader.TAGS['reading-list']
		} else if (feed == 'starred') {
			feed = reader.TAGS.starred
		} else if (feed.id) {
			feed = feed.id
		}

		core.addChange('feed', feed, 'markAllAsRead', true)

		storage.requestSave()

	},

	// Mark an item as read
	markRead: function(item, callback) {

		item.isRead = true
		ui.updateArticle(item)
		var feedId = item.origin.streamId

		ui.updateFeed(core.getFeed(feedId))
		ui.updateFilters()
		
		if (callback) callback()

		core.addChange('item', item, 'read', true)
		core.addChange('item', item, 'kept-unread', false)

		storage.requestSave()
	},

	// Mark an item as unread (or read)
	toggleRead: function(item, callback) {
		console.log('toggling unread')

		var isRead = true,
			isKeptUnread = false,
			int = 1,
			feedId = item.origin.streamId

		if (!item.isRead) {
			item.isRead = true
			int = -1;
		} else {
			isRead = false
			;delete item.isRead
			isKeptUnread = true
		}

		ui.updateReadButton(!isRead)

		ui.updateFeed(core.getFeed(feedId))
		ui.updateFilters()

		ui.updateArticle(item)
		if (callback) callback(isRead)

		core.addChange('item', item, 'read', isRead)
		core.addChange('item', item, 'kept-unread', isKeptUnread)

		storage.requestSave()

	},

	// Toggle .isStarred
	toggleStarred: function(item, callback) {
		var isStarred = true
		if (!item.isStarred) {
			item.isStarred = true
		} else {
			delete item.isStarred
			isStarred = false
		}
		ui.updateArticle(item)
		ui.updateFeed(core.getFeed(item.origin.streamId))
		ui.updateFilters()
		if (callback) callback(isStarred)

		core.addChange('item', item, 'star', isStarred)

		storage.requestSave()
	},



	// *************************************
	// *
	// * Editing Feeds
	// *
	// *************************************

	// Add a feed
	addFeed: function(feedUrl) {

		$$.modal.add.error.hide()

		reader.processFeedInput(feedUrl, 'url', function(d) {

			cmd('hide')

			reader.subscribeFeed(feedUrl, function() {

				console.log("subscribed")

				core.loadFeeds(function() {
					var feed = core.getFeed('feed/' + feedUrl)
					core.loadItems(feed, function() {
						$$.feeds.append(ui.drawFeed(feed))
						core.updateCounts(function() {
							ui.updateFilters()
						})
					})
				})

			}, d.title)

		}, function(e) {
			$$.modal.add.error.show()
		})
	},

	// Removing a feed
	removeFeed: function(feed) {

		ui.removeFeed(feed, function(status) {
			if (status) {
				core.addChange('feed', feed.id, 'unsubscribe', true)
				core.getFeed('user/-/state/com.google/reading-list').count -= feed.count
				;delete storage.items[feed.id]
				var index = storage.feeds.indexOf(feed)
				storage.feeds.splice(index, 1)
				storage.requestSave()
				ui.updateFilters()
			}
		})

	},

	updateCounts: function(callback) {
		reader.getUnreadCounts(function(d) {
			for (var key in d) {
				console.log(key, d[key])
				var feed = core.getFeed(key)
				if (feed) {
					console.log('Made it')
					feed.count = d[key]
				}
			}
			if (callback) callback()
		}, true)
	},

	renameFeed: function(feed) {
		ui.renameFeed(feed, function(title) {
			feed.title = title
			core.addChange('feed', feed.id, 'title', title)
			storage.requestSave()
		})
	},

	renameLabel: function(label) {
		ui.renameFeed(label, function(title) {
			core.addChange('feed', label.title, 'titleLabel', title)
			label.title = title
			storage.requestSave()
		})
	},



	// *************************************
	// *
	// * Search
	// *
	// *************************************

	search: function(feed, _query) {
		var items = core.getItemsInFeed(feed),
			results = [],
			query = _query.split(' '),
			search
		itemLoop:
		for (var i = 0; i < items.length; i++) {
			queryLoop:
			for (var j = 0; j < query.length; j++) {
				search = new RegExp(query[j], 'i')
				if (!search.test(items[i].title + items[i].origin.title)) {
					continue itemLoop
				}
			}
			results.push(items[i])
		}
		return results
	},




	// *************************************
	// *
	// * Auth
	// *
	// *************************************

	// Login
	login: function(username, password, successCallback, failCallback) {
		if(
			typeof(username) == 'string' &&
			username.length > 0 &&
			typeof(password) == 'string' &&
			password.length > 0
		) {
			reader.login(username, password, successCallback, failCallback)
		} else {
			failCallback()
		}
	},





	// *************************************
	// *
	// * Refresh
	// *
	// *************************************

	init: function() {

		// Load user credentials
		storage.loadAuth(function() {

			// If we can login
			if(reader.load()) {

				ui.loadSettings()

				// Load feeds and items
				storage.load(function() {

					// If we have feeds
					if (storage.feeds.length !== 0) {
						ui.init()

						if (settings.sync.onStart) {
							core.refresh()
						}

					} else {
						// Run sync
						core.refresh()
					}
				})

			} else {

				// Let user login
				$$.modal.login.el.fadeIn(300)

			}
		})

	},

	// Download feeds and articles form Google Reader
	refresh: function() {
		ui.sync.start()
		onLine(function(status) {

			// If we are online...
			if(status) {
				if(sync.pending) {
					core.sync(function() {
						console.log("Sync has finished!")
						core.refresh()
					})
				} else {
					core.loadFeeds(function() {
						core.loadItems(undefined, function(percent) {
							console.log(percent + "%")
							if(percent >= 100) {
								core.removeOldItems()
								ui.loadFeeds()
								ui.updateFilters()
								ui.notify()
								ui.sync.end()
							}
						})
					})
				}

			} else {
				console.log("Not online...")

				setTimeout(function() {
					ui.sync.end()
				}, 300)
			}
		})
	},


	refreshTimeout: false,
	refreshOnTimer: function() {
		var timer = settings.sync.interval * 60000
		clearTimeout(core.refreshTimeout)
		if (timer > 0) {
			core.refreshTimeout = setTimeout(function() {
				core.refresh()
				core.refreshOnTimer()
			}, timer)
		}
	},





	// *************************************
	// *
	// * Sync
	// *
	// *************************************

	addChange: function(type, obj, property, value) {

		if(type == 'feed') {
			obj = {
				id: obj
			}
		} else {
			obj = {
				feed: obj.origin.streamId,
				id: obj.id
			}
		}

		if(!sync.changes[type][obj.id]) {
			sync.changes[type][obj.id] = {
				obj: obj
			}
		}

		sync.pending = true
		sync.changes[type][obj.id][property] = value
		core.requestSync()
		storage.savePrefs()
	},

	syncActive: false,
	syncTimeout: false,
	requestSync: function() {
		if(core.syncTimeout === false) {
			core.syncTimeout = setTimeout(core.sync, 1000)
		} else {
			clearTimeout(core.syncTimeout)
			core.syncTimeout = false
			core.requestSync()
		}
	},

	sync: function(callback) {

		console.log("Running sync")

		onLine(function(status) {
			if(status) {

				// Don't run sync multiple times at once.
				if (core.syncActive) {

					// If sync is running, wait half a second and try again
					setTimeout(function() {
						core.sync(callback)
					}, 500)

				} else {

					console.log("Sync is now active")

					core.syncActive = true

					var timer = false

					var successCallback = function() {
						if(callback) {
							if(timer === false) {
								timer = setTimeout(callback, 1500)
							} else {
								clearTimeout(timer)
								timer = setTimeout(callback, 1500)
							}
						}
					},
						change, obj, value, property, key

					for (key in sync.changes.feed) {
						change = sync.changes.feed[key]
						obj = change.obj

						for (property in change) {
							switch(property) {

							case 'unsubscribe':
								console.log("Unsubscribing", obj.id)
								reader.unsubscribeFeed(obj.id, successCallback)
								break

							case 'markAllAsRead':
								console.log("Marking All Read in " + obj.id)
								reader.markAllAsRead(obj.id, successCallback)
								break

							case 'title':
								reader.editFeedTitle(obj.id, change.title, successCallback)
								break

							case 'titleLabel':
								reader.editLabelTitle(obj.id, change.titleLabel, successCallback)
								break
							}
						}

						delete sync.changes.feed[key]

					}

					for (key in sync.changes.item) {
						change = sync.changes.item[key]
						obj = change.obj

						for (property in change) {
							switch(property) {

							case 'read':
								console.log("Marking read: " + obj.feed + " -- " + obj.id + " -- " + change[property])
								reader.setItemTag(obj.feed, obj.id, 'read',
									change[property], successCallback)
								break

							case 'kept-unread':
								reader.setItemTag(obj.feed, obj.id,
									'kept-unread', change[property], successCallback)
								break

							case 'star':
								reader.setItemTag(obj.feed, obj.id, 'star',
									change[property], successCallback)
							break

							}
						}

						delete sync.changes.item[key]

					}

					console.log("Sync is no longer active")

					sync.pending = false
					core.syncActive = false

					storage.savePrefs()
				}

			} else {
				console.log("Not online...")
			}
		})
	},


	// *************************************
	// *
	// * Pocket
	// *
	// *************************************

	pocket: {

		apikey: '52dAvce7d6282Kd70gpp34cp59T0w58c',

		user: {
			loggedIn: false,
			username: '',
			password: ''
		},

		login: function(username, password, callback) {

			ui.share.setActive()

			var url = "https://readitlaterlist.com/v2/stats?"
				url += "username=" + username
				url += "&password=" + password
				url += "&apikey=" + core.pocket.apikey

			$.ajax({
				url: url,
				success: function() {
					core.pocket.user.username = username
					core.pocket.user.password = password
					core.pocket.user.loggedIn = true
					ui.share.setInactive()
					callback(true)
					storage.savePrefs()
				},
				error: function(e) {
					callback(false)
				}
			})

		},

		logout: function() {
			core.pocket.user.username = ''
			core.pocket.user.password = ''
			core.pocket.user.loggedIn = false
			storage.savePrefs()
		},

		add: function(item) {

			if (core.pocket.user.loggedIn) {
				ui.share.setActive()
				var url = "https://readitlaterlist.com/v2/add?"
				url += "username=" + core.pocket.user.username
				url += "&password=" + core.pocket.user.password
				url += "&apikey=52dAvce7d6282Kd70gpp34cp59T0w58c"
				url += "&url=" + item.alternate[0].href
				url += "&title=" + item.title
				$.ajax({
					url: url,
					success: function() {
						ui.share.setInactive()
					},
					error: function(e) {
						if (e.status == 401) {
							core.pocket.logout()
							cmd('pocket')
						}
					}
				})
			} else {
				cmd('pocket')
			}
		}

	},

	// *************************************
	// *
	// * Instapaper
	// *
	// *************************************

	instapaper: {

		user: {
			loggedIn: false,
			username: '',
			password: ''
		},

		login: function(username, password, callback) {

			ui.share.setActive()

			var url = "https://www.instapaper.com/api/authenticate"
				url += "?username=" + username
				url += "&password=" + password

			$.ajax({
				url: url,
				success: function() {
					core.instapaper.user.username = username
					core.instapaper.user.password = password
					core.instapaper.user.loggedIn = true
					ui.share.setInactive()
					callback(true)
					storage.savePrefs()
				},
				error: function(e) {
					callback(false)
				}
			})

		},

		logout: function() {
			core.instapaper.user.username = ''
			core.instapaper.user.password = ''
			core.instapaper.user.loggedIn = false
			storage.savePrefs()
		},

		add: function(item) {

			if (core.instapaper.user.loggedIn) {
				ui.share.setActive()
				var url = "https://www.instapaper.com/api/add"
				url += "?username=" + core.instapaper.user.username
				url += "&password=" + core.instapaper.user.password
				url += "&url=" + item.alternate[0].href
				url += "&title=" + item.title

				$.ajax({
					url: url,
					success: function() {
						ui.share.setInactive()
					},
					error: function(e) {
						if (e.status == 403) {
							core.instapaper.logout()
							cmd('instapaper')
						}
					}
				})
			} else {
				cmd('instapaper')
			}
		}

	}

}