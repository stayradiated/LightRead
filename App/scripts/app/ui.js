
/*jshint asi: true*/

// The UI
ui = {

	init: function() {
		// Show UI
		$$.loading.el.hide()
		ui.loadFeeds()
		ui.updateFilters()

		if (settings.rememberLastFeed && settings.lastFeed) {
			var feed = settings.lastFeed

			// Filters
			if (feed == 'all' || feed == 'unread' || feed == 'starred') {
				ui.selectFilter($$.filters[feed])

			// Feed
			} else if (core.getFeed(feed)) {
				ui.selectFeed(ui.getFeedView(feed))
			}
		}
	},

	reload: function() {
		cmd('hide')
		$$.loading.progress.hide()
		$$.loading.el.show()
		$$.modal.login.password.val('')
		core.init()
	},





	// *************************************
	// *
	// * Get View from ID
	// *
	// *************************************

	// Get the view
	getFeedView: function(feedId) {
		return $$.feeds.find('[data-id="' + feedId + '"]')
	},
	getArticleView: function(itemId) {
		return $$.articles.find('[data-id="' + itemId + '"]')
	},





	// *************************************
	// *
	// * Label
	// *
	// *************************************

	toggleLabel: function($this) {

		if (!$this) {
			var $current = ui.getFeedView(selected.feed.id),
				$label = $current.closest('li')
				if($label.length) {
					$this = $label
				} else {
					return
				}
		}

		var label = core.getFeed($this.find('header').attr('data-id'))

		if ($this.hasClass('expanded')) {
			ui.collapseLabel($this)
			if (!settings.label[label.id]) settings.label[label.id] = {}
			settings.label[label.id].expanded = false
		} else {
			ui.expandLabel($this)
			if (!settings.label[label.id]) settings.label[label.id] = {}
			settings.label[label.id].expanded = true
		}

		storage.savePrefs()
	},

	expandLabel: function($this) {
		$this.addClass('expanded')
		$this.find('ul').slideDown(300)
	},

	collapseLabel: function($this) {
		$this.removeClass('expanded')
		$this.find('ul').slideUp(300)
	},






	// *************************************
	// *
	// * Navigation
	// *
	// *************************************

	setScope: function(scope) {

		selected.column = scope
		key.setScope(scope)
		$('.scope').removeClass('scope')
		$$.column[scope].addClass('scope')

	},

	moveScope: function(direction) {
		switch (direction) {
			case 'left':
				switch(selected.column) {
					case 'articles':
						ui.setScope('feeds')
						break
					case 'post':
						ui.setScope('articles')
				}
				break
			case 'right':
				switch(selected.column) {
					case 'articles':
						ui.setScope('post')
						break
					case 'feeds':
						ui.setScope('articles')
				}
				break
		}
	},

	nextFeed: function() {
		var $current, $next

		// Filters
		if (typeof(selected.feed) == 'string') {
			$next = $$.feeds.find('li').first()
			if ($next.is('.label')) {
				$next = $next.find('header')
			}
			if ($next.length) {
				ui.selectFeed($next)
			}
			return
		}

		// Feeds
		$current = ui.getFeedView(selected.feed.id)

		// Move focus to li
		if ($current.is('header')) {
			$current = $current.parent()
		}

		// Label header -> First item in label
		if ($current.is('.expanded')) {
			$next = $current.find('ul li').first()

		// Last item in label -> Next feed
		} else if (
			$current.is(':last-child') &&
			$current.parent().hasClass('feeds')
		) {
			$next = $current.parent().parent().next()

		// Next feed
		} else {
			$next = $current.next()
		}

		// Move focus back to header
		if ($next.is('.label')) {
			$next = $next.find('header')
		}

		// Select
		if ($next.length) {
			ui.selectFeed($next)
		}
	},

	prevFeed: function() {
		var $current, $prev

		// Filters
		if (typeof(selected.feed) == 'string') {
			$next = $$.feeds.find('li').last()
			if ($next.is('.label')) {
				$next = $next.find('header')
			}
			if ($next.length) {
				ui.selectFeed($next)
			}
			return
		}

		// Feeds
		$current = ui.getFeedView(selected.feed.id)

		// Move focus to li
		if ($current.is('header')) {
			$current = $current.parent()
		}

		// First feed -> Filters
		// if (
		// 	$current.is(':first-child') &&
		// 	$current.parent().is('#feeds')
		// ) {
		// 	$prev = $$.filters.starred
		// 	ui.selectFilter($prev)
		// 	return

		// First item in label -> Label header
		if (
			$current.is(':first-child') &&
			$current.parent().hasClass('feeds')
		) {
			$prev = $current.parent().parent().find('header')

		// Prev feed
		} else {
			$prev = $current.prev()
		}

		// Moving into a label
		if ($prev.is('.label')) {
			// Last item in label
			if ($prev.is('.expanded')) {
				$prev = $prev.find('ul li').last()
			// Label header
			} else {
				$prev = $prev.find('header')
			}
		}

		// Select
		if ($prev.length) {
			ui.selectFeed($prev)
		}
	},

	nextArticle: function(type) {

		type = type || 'select'

		var $current, $next,
			offset = $$.articles.height() / 2 - 100

		if(selected.item) {
			switch (type) {
				case 'select':
					$current = ui.getArticleView(selected.item.id)
					break
				case 'scan':
					$current = $$.articles.find('.hover').first()
					if (!$current.length) {
						$current = ui.getArticleView(selected.item.id)
					}
					break
			}
			$next = $current.next()
		} else {
			$current = $$.articles.find('.hover').first()
			if (!$current.length) {
				$next = $$.articles.find('li').first()
			} else {
				$next = $current.next()
			}
		}
		
		if($next.is('.splitter')) $next = $next.next()

		if ($next.length) {
			$$.articles[0].scrollTop = $next[0].offsetTop - offset

			switch (type) {
				case 'select':
					ui.selectArticle($next)
					break
				case 'scan':
					$$.articles.find('.hover').removeClass('hover')
					$next.addClass('hover')
					break
			}
		}
	},

	prevArticle: function(type) {

		type = type || 'select'

		var $current, $prev,
			offset = $$.articles.height() / 2 - 100

		if(selected.item) {
			switch (type) {
				case 'select':
					$current = ui.getArticleView(selected.item.id)
					break
				case 'scan':
					$current = $$.articles.find('.hover').first()
					if (!$current.length) {
						$current = ui.getArticleView(selected.item.id)
					}
					break
			}
			$prev = $current.prev()
		} else {
			$current = $$.articles.find('.hover').first()
			if (!$current.length) {
				$prev = $$.articles.find('li').first()
			} else {
				$prev = $current.prev()
			}
		}

		if($prev.is('.splitter')) $prev = $prev.prev()

		if ($prev.length) {
			$$.articles[0].scrollTop = $prev[0].offsetTop - offset

			switch (type) {
				case 'select':
					ui.selectArticle($prev)
					break
				case 'scan':
					$$.articles.find('.hover').removeClass('hover')
					$prev.addClass('hover')
					break
			}
		}
	},

	openHoverArticle: function() {
		var $this = $$.articles.find('.hover').first()
		ui.selectArticle($this)
	},

	scrollUp: function(length) {
		length = length || 20
		if (length == 'page') length = $$.postWrapper.height() - 50
		$$.postWrapper[0].scrollTop -= length
	},

	scrollDown: function(length) {
		length = length || 20
		if (length == 'page') length = $$.postWrapper.height() - 50
		$$.postWrapper[0].scrollTop += length
	},







	// *************************************
	// *
	// * Drawing stuff
	// *
	// *************************************

	// Render a Feed
	drawFeed: function(feed) {
		var count

		if(feed.id == 'user/-/state/com.google/starred') {
			count = core.getItemsInFeed('starred').length
		} else if (feed.id == 'user/-/state/com.google/reading-list') {
			count = core.getItemsInFeed('unread').length
		} else if (selected.filter == 'starred') {
			count = core.getStarredCount(feed)
		} else {
			count = core.getUnreadCount(feed) || 0
		}

		var model = {
			id: feed.id,
			icon: reader.getIconForFeed(feed.htmlUrl),
			title: feed.title,
			count: count
		}
		return template.feed(model)
	},

	// Render a Label
	drawLabel: function(label) {

		var count
		if(selected.filter == 'starred') {
			count = core.getStarredCount(label)
		} else {
			count = core.getUnreadCount(label) || 0
		}

		var feeds = []
		for(var j = 0; j < label.feeds.length; j++) {
			feeds.push(ui.drawFeed(label.feeds[j]))
		}
		var model = {
			id: label.id,
			title: label.title,
			count: count,
			feeds: feeds
		}
		return template.label(model)
	},

	// Render an Item as an Article
	drawArticle: function(item) {
		var model = {
			id: item.id,
			feed: item.origin.title,
			icon: reader.getIconForFeed(item.origin.htmlUrl),
			title: item.title,
			time: core.time(item.published),
			snippet: core.snippet(item),
			read: item.isRead,
			starred: item.isStarred
		}
		return template.article(model)
	},

	drawArticleSplitter: function(date) {
		var model = {
			date: date
		}
		return template.articleSplitter(model)
	},




	// *************************************
	// *
	// * Loading stuff
	// *
	// *************************************

	// Load all feeds to the DOM
	loadFeeds: function() {
		ui.updateFilters()
		ui.filterFeeds(selected.filter)
	},

	// Reload the current items.
	reloadItems: function() {
		// Hacky but works
		// if (
		// 	selected.feed != 'all' &&
		// 	selected.feed != 'unread' &&
		// 	selected.feed != 'starred'
		// ) {
		// 	ui.getFeedView(selected.feed.id).click()
		// } else {
		// 	$$.filters[selected.feed].click()
		// }
	},

	// Load articles
	loadItems: function(feed, isArray, scroll, max) {

		console.log("Running loadItems")

		max = max || 25
		scroll = scroll || 0

		var markup = "", items, count = 0

		if (isArray) {
			items = feed
		} else {
			if (feed.isFilter) {
				items = core.getItemsInFeed('all')
			} else if(feed.isLabel) {
				items = core.loadLabel(feed)
			} else {
				items = storage.items[feed.id]
				items = core.sortItems(items)
			}

			items = core.filterItems(items, selected.filter)
			selected.itemsArray = items
		}

		items = core.groupByDay(items)

		// Passive loading madness
		date:
		for (var i = 0; i < items.length; i++) {
			markup += ui.drawArticleSplitter(items[i][0])

			item:
			for (var j = 0; j < items[i][1].length; j++) {
				markup += ui.drawArticle(items[i][1][j])
				count++
				if(count > max && max != 'all') break date
			}
		}

		$$.articles.html(markup)
		$$.articles.find('.splitter').prev().addClass('no-border')
		$$.bar.itemCount.html(core.getItemCount(selected.itemsArray))

		$$.articles[0].scrollTop = scroll
	},

	// Load an Item as a Post
	loadPost: function(post) {

		//Fix Sites with no link
		var link = "#"
		try { link = post.alternate[0].href } catch (err) {}

		var model = {
			feed: core.getFeed(post.origin.streamId).title,
			title: post.title,
			author: post.author,
			time: core.longDate(post.published)+" "+core.time(post.published),
			content: core.content(post),
			link: link
		}

		// Auto instapaperizer
		if (settings.autoInstapaperizer) {
			cmd('mobilizer')
			return
		}

		$$.postWrapper.removeClass('instapaper')
		$$.post.html(template.post(model).replace(/<iframe/ig, '<xframe').replace(/<\/iframe>/ig,'</xframe')).find('a:has(img)').addClass('hasImage')

		// Scroll to top
		$$.postWrapper[0].scrollTop = 0

		$$.post.find('img').map(function() {
			var $this = $(this)
			if ($this.attr('height') == "1") $this.addClass("no-border")
			else if ($this.attr('width') == "1") $this.addClass("no-border")
			else if ($this.attr('border') == "0") $this.addClass('no-border')
		})

		//Removes Flare
		$$.post.find('a').map(function() {
			if ($(this).attr('href').substr(0,32) == 'http://feeds.feedburner.com/~ff/') {
				$(this).parent().remove()
			}
		})

		//YouTube Polyfill
		var youtube_videos = []
		$$.post.find('xframe').map(function() {
			if(/youtube.com/.test($(this).attr('src'))) youtube_videos.push(this)
		})

		//Loops through array of selectors
		for (var i=0; i < youtube_videos.length; i++) {
			_this = $(youtube_videos[i])
			console.log("Found video: '"+_this.attr('src')+"'")
			var video_id = /(v|embed)\/([^&?$]*)/.exec(_this.attr('src'))[2]
			console.log("video_id: '"+video_id+"'")
			var url = "http://img.youtube.com/vi/" + video_id + "/0.jpg"
			_this.replaceWith('<a class="youtube" href="http://youtube.com/watch?v=' + video_id + '"><img src="' + url + '"></a>')
		}

		//Removes iFrame (And parts of posts -- why did we have this here?)
		// $$.post.find('p').first().find('xframe').closest('p').remove()

		//Scrubs YouTube

	},





	// *************************************
	// *
	// * Selecting stuff
	// *
	// *************************************

	selectFilter: function($this) {
		var type

		// Set selected state
		$$.filters.el.find('.selected').removeClass('selected')
		$this.addClass('selected')

		if ($this.hasClass('all')) {
			type = 'all'
		} else if ($this.hasClass('unread')) {
			type = 'unread'
		} else if ($this.hasClass('starred')) {
			type = 'starred'
		}

		selected.filter = type
		selected.feed = type

		// Save last feed (so we can open it again at startup)
		settings.lastFeed = type
		storage.savePrefs()

		// Close post
		ui.closePost()

		ui.filterFeeds(selected.filter)
		setTimeout(function() {
			ui.loadItems({isFilter: true}, false, 0)
		})
	},

	selectFeed: function($this) {

		console.log("Running selectFeed")

		// Set selected state
		$$.feeds.find('.selected').removeClass('selected')
		$this.addClass('selected')

		// Get ID
		var id = $this.data('id')

		// Set selected.feed for other functions
		selected.feed = core.getFeed(id)

		// Save feed id (so we can open it again at startup)
		settings.lastFeed = id
		storage.savePrefs()

		// Close post
		ui.closePost()

		// Render items
		setTimeout(function() {
			ui.loadItems(selected.feed, false, 0)
		}, 5)
	},

	selectArticle: function($this) {
		// Set selected state
		$$.articles.find('.hover').removeClass('hover')
		$$.articles.find('.selected').removeClass('selected')
		$this.addClass('selected')

		// Get ID
		var id = $this.data('id')

		// Set selected.item
		selected.item = core.getItem(id)

		// Mark read
		if (!selected.item.isRead) core.markRead(selected.item)

		// Updated buttons
		ui.updateStarredButton(selected.item.isStarred)
		ui.updateReadButton(false)
		$$.bar.post.removeClass('disabled')

		setTimeout(ui.loadPost, 5, selected.item)
	},




	// *************************************
	// *
	// * Updating stuff
	// *
	// *************************************

	// Update Article
	updateArticle: function(item) {
		var $this = this.getArticleView(item.id)
		var addClass = false
		if ($this.hasClass('selected')) addClass = true

		$this.replaceWith(function() {
			var $item = $(ui.drawArticle(item))
			if (addClass) $item.addClass('selected')
			return $item
		})
	},

	// Update Feed
	updateFeed: function(feed) {

		var $this = this.getFeedView(feed.id)

		var $feed = $(ui.drawFeed(feed))

		$this.find('.title, .count').replaceWith($feed.find('.title, .count'))

		if(feed.categories) {
			for (var i = 0; i < feed.categories.length; i++) {
				this.updateFeed(core.getFeed(feed.categories[i].id))
			}
		}
	},

	// Update filters
	updateFilters: function() {

		var unreadFeed = core.getFeed('user/-/state/com.google/reading-list'),
			starredFeed = core.getFeed('user/-/state/com.google/starred'),
			unreadCount = 0

		// Unread
		var filter = $(this.drawFeed(unreadFeed))
		// Replace title
		filter.find('.title').html('Unread')
		filter = filter.find('.title, .count')
		$$.filters.unread.find('.title, .count').replaceWith(filter)

		if (filter.length > 1) unreadCount =  filter[1].innerText

		python('count', unreadCount)

		// Starred
		filter = $(this.drawFeed(starredFeed)).find('.title, .count')
		$$.filters.starred .find('.title, .count').replaceWith(filter)
	},

	// Updates starred button state
	updateStarredButton: function(isStarred) {
		if (isStarred) $$.button.star.addClass('starred')
		else  $$.button.star.removeClass('starred')
	},

	// Updates read button state -- may not be needed
	updateReadButton: function(isRead) {
		if (isRead) $$.button.read.addClass('read')
		else  $$.button.read.removeClass('read')
	},





	// *************************************
	// *
	// * Buttons
	// *
	// *************************************

	markAllAsRead: function() {
		$$.articles.find('li').map(function() {
			$(this).addClass('read')
		})
	},

	showMarkAllAsRead: function() {
		$$.modal.markAllAsRead.el.fadeToggle(150)
	},

	closePost: function() {
		$$.post.empty()
		$$.articles.find('.selected').removeClass('selected')
		$$.bar.post.addClass('disabled')
		selected.item = undefined
	},




	// *************************************
	// *
	// * Filters
	// *
	// *************************************

	// Filters
	filterFeeds: function(_filter) {
		var filter = _filter || 'all',
			markup = "",
			feeds = [],
			feed = {},
			i = 0,
			count = 0

		switch(filter) {
			case 'all':
				feeds = storage.feeds
				break
			case 'unread':
				feeds = core.getUnreadFeeds()
				break
			case 'starred':
				feeds = core.getStarredFeeds()
				break
		}

		for (i = 0; i < feeds.length; i++) {
			feed = feeds[i]
			// Draw a label
			if (feed.isLabel) {
				markup += ui.drawLabel(feed)
				count++
			// Draw a feed
			} else if (feed.isFeed) {
				markup += ui.drawFeed(feed)
				count++
			}
		}

		if (count < 1 && filter == 'all') {
			$$.emptyMessage.fadeIn(150)
		} else {
			$$.emptyMessage.hide()
		}

		$$.feeds.html(markup)

		// Set slide state
		$$.feeds.find('.label').map(function() {
			var $label = $(this),
				label = core.getFeed($label.children('header').data('id')),
				expand = false

			if (settings.label[label.id]) {
				if (settings.label[label.id].expanded) {
					expand = true
				}
			}

			if (expand) {
				$label.addClass('expanded')
					.children('ul').slideDown(0)
			} else {
				$label.children('ul').slideUp(0)
			}

		})

		if (selected.feed && typeof(selected.feed) == 'object') {
			ui.getFeedView(selected.feed.id).addClass('selected')
		}
	},


	// *************************************
	// *
	// * Search
	// *
	// *************************************

	toggleSearch: function() {
		$$.bar.searchInput.attr('placeholder', 'Search ' + $$.bar.itemCount.html())
		$$.bar.searchInput.toggle().focus()
		$$.bar.itemCount.toggle()
	},

	search: function() {
		var items = core.search(selected.feed, $$.bar.searchInput.val())
		ui.loadItems(items, true)
		if (selected.item) {
			ui.getArticleView(selected.item.id).addClass('selected')
		}

		// Awesome animation (with bugs)
		/*var max = 10, count = 0, time = 150
		$$.articles.find('li').map(function() {
			var item = core.getItem($(this).data('id')),
				$this = $(this)
			if (items.indexOf(item) == -1 && !$this.hasClass('hidden')) {
				if(count <= max) $this.slideUp(time)
				else $this.hide()
				$this.addClass('hidden')
				count++
			} else if (items.indexOf(item) > -1 && $this.hasClass('hidden')) {
				if(count <= max) $this.slideDown(time)
				else $this.show()
				$this.removeClass('hidden')
				count++
			}
		})*/
	},




	// *************************************
	// *
	// * Login
	// *
	// *************************************

	login: function() {

		// Get username and password from form
		var username = $$.modal.login.username.val(),
			password = $$.modal.login.password.val()

		// Login to Google Reader
		core.login(username, password, function() {

			// Successfully logged in

			// Fade out login form
			$$.modal.login.el.fadeOut(300, function() {

				// Fade in progress bar
				$$.loading.progress.fadeIn(300)

				// Load the users feeds
				core.loadFeeds(function() {

					// On load

					// Load users settings
					ui.loadSettings()

					// Load users items in each feed
					var loaded = false,
						completed = false
					core.loadItems(undefined, function(percent) {

						// Set progress bar to 90%
						if(!loaded) {
							ui.setProgressBarVal(90)
							loaded = true

						// Items have finished loading
						} else if(percent >= 100 && !completed) {

							// Make sure that it only runs once.
							// Because it would be bad if it didn't
							completed = true

							// Set progress bar to 100%
							ui.setProgressBarVal(100, function() {

								// Load feeds in UI
								ui.loadFeeds()

								// Load filter counts in UI
								ui.updateFilters()

								// Select the All Items filter
								ui.selectFilter($$.filters.all)

								// After half a second, fade out the loading
								// page and show the UI
								setTimeout(function() {
									$$.loading.el.fadeOut(300, function() {

										// Reset progress bar
										ui.setProgressBarVal(0)
									})
								}, 500)
							})
						}
						console.log(percent)
					})
				})
			})
		}, function() {
			$$.modal.login.password.val('')
			$$.modal.login.error.fadeIn(300)
			setTimeout(function() {
				$$.modal.login.error.fadeOut(300)
			}, 3000)
		})
	},

	setProgressBarVal: function(val, callback) {
		// $$.loading.progressBar.val(val)
		var current = $$.loading.progressBar.val(),
			diff = val - current,
			int = diff > 0 ? 0.5 : -0.5,
			increment = function() {
				current += int
				$$.loading.progressBar.val(current)
			},
			timer = setInterval(function() {
				if(current !== val) {
					increment()
				} else {
					clearInterval(timer)
					if(callback) callback()
				}
			}, 20)
	},




	// *************************************
	// *
	// * Sync
	// *
	// *************************************

	sync: {
		timer: false,
		active: false,
		start: function() {
			if(!ui.sync.timer) {
				ui.sync.active = true
				var i = -7
				ui.sync.timer = setInterval(function() {
					$$.button.refresh.css('background-position-y', (i * 36) + 5)
					i--
					if (i < -7) i = -0
					if(!ui.sync.active && i == -7) {
						clearInterval(ui.sync.timer)
						ui.sync.timer = false
					}
				}, 35)
				}
		},
		end: function() {
			ui.sync.active = false
		}
	},





	// *************************************
	// *
	// * Context menu
	// *
	// *************************************

	drawMenuItem: function(model) {
		return template.contextMenuItem(model)
	},

	showContextMenu: function(e, $this, type) {

		selected.menu = true

		var items = []

		$$.articles.find('.hover').removeClass('hover')
		$$.feeds.find('.hover').removeClass('hover')

		switch(type) {
			case 'label':
				var label = core.getFeed($this.data('id'))
				items.push({
					className: 'rename',
					text: "Rename...",
					section: false
				})
				break
			case 'feed':
				var feed = core.getFeed($this.data('id'))
				items.push({
					className: 'openHomePage',
					text: "Open home page",
					section: true
				},{
					className: 'remove',
					text: "Unsubscribe...",
					section: false
				},{
					className: 'rename',
					text: "Rename...",
					section: false
				})
				break
			case 'article':
				var item = core.getItem($this.data('id'))
				items.push({
					className: 'read',
					text: item.isRead ? "Unread" : "Read",
					section: false
				},{
					className: 'star',
					text: item.isStarred ? "Unstar" : "Star",
					section: true
				},{
					className: 'getLink',
					text: 'Copy Link',
					section: false
				},{
					className: 'openItemPage',
					text: 'Open in Browser',
					section: false
				})
				break
			case 'share':
				items.push({
					className: 'pocket',
					text: 'Send to Pocket',
					section: false
				},{
					className: 'instapaper',
					text: 'Send to Instapaper',
					section: false
				},{
					className: 'gwibber',
					text: 'Send to Gwibber',
					section: false
				})
				break
		}

		$this.addClass('hover')

		$$.contextMenu.css({
			'top': e.clientY - 3,
			'left': e.clientX + 2
		})

		var markup = ""
		for (var i = 0; i < items.length; i++) {
			markup += ui.drawMenuItem(items[i])
		}

		$$.contextMenu.html(markup).show()

		switch(type) {
			case 'label':
				// Rename
				$$.contextMenu.find('.rename').click(function() {
					core.renameLabel(label)
				})
				break

			case 'feed':

				// Open home page
				$$.contextMenu.find('.openHomePage').click(function() {
					document.location = feed.htmlUrl
				})

				// Unsubscribe
				$$.contextMenu.find('.remove').click(function() {
					core.removeFeed(feed)
				})

				// Rename
				$$.contextMenu.find('.rename').click(function() {
					core.renameFeed(feed)
				})
				break

			case 'article':

				// Toggle Read
				$$.contextMenu.find('.read').click(function() {
					core.toggleRead(item, function(isRead) {
						if($this.is('.selected')) {
							ui.updateReadButton(!isRead)
						}
					})
				})

				// Toggle Starred
				$$.contextMenu.find('.star').click(function() {
					core.toggleStarred(item, function(isStarred) {
						if($this.is('.selected')) {
							ui.updateStarredButton(isStarred)
						}
					})
				})

				// Get link
				$$.contextMenu.find('.getLink').click(function() {
					python('copy', item.alternate[0].href)
				})

				// Open item page
				$$.contextMenu.find('.openItemPage').click(function() {
					document.location = item.alternate[0].href
				})

				break

			case 'share':
			
				// Pocket
				$$.contextMenu.find('.pocket').click(function() {
					cmd('pocket')
				})
				
				// Instapaper
				$$.contextMenu.find('.instapaper').click(function() {
					cmd('instapaper')
				})

				// Gwibber
				$$.contextMenu.find('.gwibber').click(function() {
					if(selected.item) {
						python('gwibber', selected.item.title+" "+selected.item.alternate[0].href)
					}
				})
				break

		}
	},

	hideContextMenu: function() {
		$$.contextMenu.fadeOut(150)
		$$.feeds.find('.hover').removeClass('hover')
		$$.articles.find('.hover').removeClass('hover')
		selected.menu = false
	},

	notify: function() {
		var count = core.getItemsInFeed('unread').length,
			prefix = 'You have ',
			suffix = count > 1 ? ' unread items' : ' unread item'
		if (count > 0) {
			python('notify', prefix + count + suffix)
		}
	},

	removeFeed: function(feed, callback) {
		$$.modal.confirm.title.html(feed.title)

		$$.overlay.show()
		$$.modal.confirm.el.show()
		
		$$.modal.confirm.yes.off('click').on('click', function() {
			ui.getFeedView(feed.id).remove()
			cmd('hide')
			callback(true)
		})
		$$.modal.confirm.no.off('click').on('click', function() {
			cmd('hide')
			callback(false)
		})

	},

	renameFeed: function(feed, callback) {
		$$.modal.rename.input.val(feed.title)
		$$.overlay.show()
		$$.modal.rename.el.show()
		$$.modal.rename.input.focus()

		var saveNave = function() {
			var title = $$.modal.rename.input.val()
			if (callback) callback(title)
			ui.getFeedView(feed.id).find('.title').html(title)
			cmd('hide')
		}

		$$.modal.rename.button.off('click').on('click', function() {
			saveNave()
		})

		$$.modal.rename.input.off('keydown').on('keydown', function(e) {
			if(e.keyCode == 13) {
				saveNave()
			} else if (e.keyCode == 27) {
				cmd('hide')
			}
		})
	},

	loadSettings: function() {
		if (localStorage.User) {
			$$.settings.email.html(JSON.parse(localStorage.User).userEmail)
		}
		$$.settings.sync.interval.val(settings.sync.interval)
		$$.settings.sync.onStart.prop('checked', settings.sync.onStart)
		$$.settings.keep.unread.val(settings.keep.unread)
		$$.settings.keep.starred.val(settings.keep.starred)
		$$.settings.keep.read.val(settings.keep.read)
		$$.settings.notifications.prop('checked', settings.notifications)
		$$.settings.max.special.val(settings.max.special)
		$$.settings.max.read.val(settings.max.read)
		$$.settings.autoInstapaperizer.prop('checked', settings.autoInstapaperizer)
		$$.settings.nightMode.prop('checked', settings.nightMode)
		$$.settings.topToolbar.prop('checked', settings.topToolbar)
		$$.settings.rememberLastFeed.prop('checked', settings.rememberLastFeed)
		core.refreshOnTimer()
		ui.nightMode()
		ui.topToolbar()
	},

	pocket: function() {
		var username = $$.modal.pocket.username.val(),
			password = $$.modal.pocket.password.val()

		core.pocket.login(username, password, function(loggedIn) {
			if (loggedIn) {
				$$.modal.pocket.el.hide()
				$$.overlay.hide()
				cmd('pocket')
			} else {
				$$.modal.pocket.password.val('')
			}
		})
	},

	instapaper: function() {
		var username = $$.modal.instapaper.username.val(),
			password = $$.modal.instapaper.password.val()

		core.instapaper.login(username, password, function(loggedIn) {
			if (loggedIn) {
				$$.modal.instapaper.el.hide()
				$$.overlay.hide()
				cmd('instapaper')
			} else {
				$$.modal.instapaper.password.val('')
			}
		})
	},

	share: {
		setActive: function() {
			$$.button.share.addClass('active')
		},
		setInactive: function() {
			$$.button.share.removeClass('active')
		}
	},
	nightMode: function(status) {
		if (status === undefined) {
			status = settings.nightMode
		} else {
			settings.nightMode = status
			storage.savePrefs()
		}

		if (status) {
			// Enable nightmode
			$('head').append('<link class="night-mode" rel="stylesheet" href="css/dark.css">')
		} else {
			// Disable nightmode
			$('head .night-mode').remove()
		}
	},
	topToolbar: function(status) {
		if (status === undefined) {
			status = settings.topToolbar
		} else {
			settings.topToolbar = status
			storage.savePrefs()
		}

		if (status) {
			// Enable nightmode
			$('head').append('<link class="top-toolbar" rel="stylesheet" href="css/toptoolbar.css">')
		} else {
			// Disable nightmode
			$('head .top-toolbar').remove()
		}
	}
}

