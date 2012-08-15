
/*jshint asi: true*/

// Selected
selected = {
	feed: undefined,
	item: undefined,
	itemsArray: [],
	filter: 'all',
	column: 'feeds',
	menu: false
}

sync = {
	pending: false,
	changes: {
		item: {},
		feed: {}
	}
}

function default_settings() {
	return {
		sync: {
			interval: 0,
			onStart: true
		},
		keep: {
			unread: -1,
			starred: -1,
			read: 14
		},
		max: {
			read: 20,
			special: 50
		},
		notifications: true,
		autoInstapaperizer: false,
		nightMode: false,
		topToolbar: false,
		rememberLastFeed: true,
		lastFeed: false,
		label: {}
	}
}

settings = default_settings()

network_status = {
	status: true,
	time: 0 // time since check
}

// window.navigator.onLine polyfill
onLine = function(callback) {
	if (network_status.time < Date.now() - 10000) {
		console.log("Checking for an active internet connection...")
		jQuery.ajax({
			url: "http://www.google.com/reader?" + Math.random(),
			timeout: 2000, //Wait 2 secs if connection problem
			async: true,
			success:function(data, status){
				network_status.status = true
				network_status.time = Date.now()
				callback(true)
			},
			error:function(x, t, m){
				network_status.status = false
				network_status.time = Date.now()
				callback(false)
			}
		})
	} else {
		callback(network_status.status)
	}
}

$(function() {

	// Splitters
	$('#app').splitter({ sizeLeft: 200 })
	$('#right-side').splitter({ sizeLeft: 300 })

	// Templates
	template = {
		label: _.template($('#label-template').html()),
		feed: _.template($('#feed-template').html()),
		article: _.template($('#article-template').html()),
		post: _.template($('#post-template').html()),
		articleSplitter: _.template($('#article-splitter-template').html()),
		contextMenuItem: _.template($('#context-menu-item').html())
	}

	// Selectors
	$$ = {
		filters: {
			el: $('#filters'),
			all: $('#filters .all'),
			unread: $('#filters .unread'),
			starred: $('#filters .starred')
		},
		feeds: $('#feeds'),
		feedsWrapper: $('#feeds-column'),
		articles: $('#articles'),
		post: $('#post'),
		postWrapper: $('#post-window'),
		hidden: $('#hidden'),
		column: {
			feeds: $('#feeds-column'),
			articles: $('#articles-column'),
			post: $('#post-column')
		},
		emptyMessage: $('#feeds-column .empty-message'),
		modal: {
			el: $('#modal'),
			add: {
				el: $('#modal .add'),
				trigger: $('#add-button'),
				input: $('#modal .add input'),
				button: $('#modal .add button'),
				exit: $('#modal .add .close'),
				error: $('#modal .add .error')
			},
			login: {
				el: $('#loading .login'),
				button: $('#loading .login .login-button'),
				username: $('#username'),
				password: $('#password'),
				error: $('#loading .login .error')
			},
			confirm: {
				el: $('#modal .confirm'),
				title: $('#modal .confirm .title'),
				yes: $('#modal .confirm .yes'),
				no: $('#modal .confirm .no')
			},
			rename: {
				el: $('#modal .rename'),
				input: $('#modal .rename input'),
				button: $('#modal .rename button')
			},
			markAllAsRead: {
				el: $('#mark-all-as-read-popup'),
				button: $('#mark-all-as-read-button')
			},
			pocket: {
				el: $('#modal .pocket-login'),
				username: $('#modal .pocket-login input[type=text]'),
				password: $('#modal .pocket-login input[type=password]'),
				button: $('#modal .pocket-login button')
			},
			instapaper: {
				el: $('#modal .instapaper-login'),
				username: $('#modal .instapaper-login input[type=text]'),
				password: $('#modal .instapaper-login input[type=password]'),
				button: $('#modal .instapaper-login button')
			}
		},
		button: {
			refresh: $('#refresh-button'),
			star: $('#star-button'),
			read: $('#read-button'),
			closePost: $('#close-post-button'),
			markAllAsRead: $('#mark-all-as-read-trigger'),
			search: $('#search-button'),
			instapaper: $('#instapaper-button'),
			share: $('#share-button')
		},
		bar: {
			itemCount: $('#item-count'),
			searchInput: $('#search-input'),
			linkUrl: $('#link-url'),
			post: $('#post-column .bar')
		},
		overlay: $('#overlay'),
		loading: {
			el: $('#loading'),
			progress: $('#loading .progress'),
			progressBar: $('#loading progress')
		},
		contextMenu: $('#context-menu'),
		settings: {
			el: $('#settings'),
			trigger: $('#settings-button'),
			reset: $('#reset-button'),
			exit: $('#settings .close'),
			email: $('#settings .email'),
			keep: {
				unread: $('#keep-unread-items'),
				starred: $('#keep-starred-items'),
				read: $('#keep-read-items')
			},
			sync: {
				onStart: $('#sync-on-start'),
				interval: $('#sync-interval')
			},
			notifications: $('#show-notifications'),
			autoInstapaperizer: $('#auto-instapaperizer'),
			nightMode: $('#night-mode'),
			topToolbar: $('#top-toolbar'),
			rememberLastFeed: $('#remember-last-feed'),
			max: {
				special: $('#max-special'),
				read: $('#max-read')
			}
		}
	}

	var height = $(window).height(),
		width = $(window).width()

	$(window).resize(function() {
		if (height != $(window).height() || width != $(window).width()) {
			// Redefines
			height = $(window).height(),
			width = $(window).width()

			// Splitter
			$('#app').trigger('resize')
		}
	})

	// Buttons
	$$.modal.add.trigger.click(function() {
		cmd('add')
	})

	$$.modal.el.find('.close').click(function() {
		cmd('hide')
	})

	// Modal
	$$.overlay.click(function() {
		cmd('hide')
	})

	$$.modal.el.click(function(e){
		e.stopPropagation()
	})

	cmd = function(req) {
		switch(req) {

			case "add":
				$$.modal.add.error.hide()
				$$.modal.add.el.show()
				$$.overlay.show()
				$$.modal.add.input.focus()
				break

			case "pocket":
				if (!core.pocket.user.loggedIn) {
					$$.overlay.show()
					$$.modal.pocket.el.show()
				} else {
					if (selected.item) {
						core.pocket.add(selected.item)
					}
				}
				break

			case "instapaper":
				if (!core.instapaper.user.loggedIn) {
					$$.overlay.show()
					$$.modal.instapaper.el.show()
				} else {
					if (selected.item) {
						core.instapaper.add(selected.item)
					}
				}
				break

			case "mobilizer":
				$$.postWrapper.addClass('instapaper')
				$$.post.html('<iframe id="instapaper" src="http://www.instapaper.com/m?u=' + core.urlencode(selected.item.alternate[0].href) + '"></iframe>')
				break

			case "logout":
				$('.logout').show().parent().show()
				$$.overlay.show()
				break

			case "hide":
				$$.modal.el.children().hide()
				$$.overlay.hide()
				$$.settings.el.hide()
				$$.modal.add.input.val('')
				break

			case 'refresh':
				core.refresh()
				break

			case 'remove':
				if (selected.feed.id) {
					core.removeFeed(selected.feed.id)
				}
				break

			case 'star':
				if(selected.item) {
					core.toggleStarred(selected.item, function(isStarred) {
						ui.updateStarredButton(isStarred)
					})
				}
				break

			case 'read':
				if(selected.item) {
					core.toggleRead(selected.item, function(isRead) {
						ui.updateReadButton(!isRead)
					})
				}
				break;

			case 'view':
				if(selected.item) {
					document.location.href = selected.item.alternate[0].href
				}
				break

			case 'next-article':
				ui.nextArticle()
				break

			case 'prev-article':
				ui.prevArticle()
				break

			case 'filter-all':
				ui.selectFilter($$.filters.all)
				break

			case 'filter-unread':
				ui.selectFilter($$.filters.unread)
				break

			case 'filter-starred':
				ui.selectFilter($$.filters.starred)
				break

			case 'settings':
				$$.settings.el.show()
				$$.overlay.show()
				break

			case 'markAllAsRead':
				if (selected.feed.id) {
					core.markAllAsRead(selected.feed.id)
				}
				break
		}
	}

	python = function(req, value) {
		document.title = 'null'
		switch(req) {
			case 'reload':
				document.title = 'reload|'
				break
			case 'count':
				document.title = 'count|' + value
				break
			case 'notify':
				if (settings.notifications) {
					document.title = 'notify|Lightread|' + value
				}
				break
			case 'copy':
				document.title = 'copy|' + value
				break
			case 'gwibber':
 				document.title = 'gwibber|' + value
 				break
		}
	}

	// Load feeds
	core.init()

	// Post
	$$.column.post.on('click', function() {
		ui.setScope('post')
	})
	$$.column.articles.on('click', function() {
		ui.setScope('articles')
	})
	$$.column.feeds.on('click', function() {
		ui.setScope('feeds')
	})

	// Feeds
	$$.feeds.on('click', '.feed, .label header', function(e) {
		if (!$(e.target).is('.icon, .bit')) {
			ui.selectFeed($(this))
		}
	})

	// Articles
	$$.articles.on('click', 'li', function() {
		ui.selectArticle($(this))
	})

	$$.articles.on('scroll', function() {
		var obj = $$.articles[0]
		if (obj.scrollTop >= (obj.scrollHeight - obj.offsetHeight + 13)) {
			ui.loadItems(selected.itemsArray, true, obj.scrollTop, 'all')
		}
	})

	// Expanding labels
	$$.feeds.on('click', '.label header .icon', function() {
		ui.setScope('feeds')
		ui.toggleLabel($(this).closest('li'))
	})

	// Adding a feed
	$$.modal.add.button.click(function() {
		var input = $$.modal.add.input.val()
		core.addFeed(input)
	})
	$$.modal.add.input.keydown(function(e) {
		if(e.keyCode == 13) {

			var input = $$.modal.add.input.val()
			core.addFeed(input)
		} else if (e.keyCode == 27) {
			cmd('hide')
		}
	})

	// Logging in
	$$.modal.login.button.click(function() {
		ui.login()
	})
	$$.modal.login.el.find('input').keydown(function(e) {
		if(e.keyCode == 13) {
			ui.login()
		}
	})

	// Refresh
	$$.button.refresh.click(function() {
		cmd('refresh')
	})

	// Toggle Starred
	$$.button.star.click(function() {
		cmd('star')
	})

	// Toggle Unread
	$$.button.read.click(function() {
		cmd('read')
	})

	// Mobilizer
	$$.button.instapaper.click(function() {
		cmd('mobilizer')
	})

	// Pocket login
	$$.modal.pocket.button.click(function() {
		ui.pocket()
	})
	$$.modal.pocket.el.find('input').keydown(function(e) {
		if (e.keyCode == 13) {
			ui.pocket()
		}
	})

	// Instapaper
	$$.modal.instapaper.button.click(function() {
		ui.instapaper()
	})
	$$.modal.instapaper.el.find('input').keydown(function(e) {
		if (e.keyCode == 13) {
			ui.instapaper()
		}
	})


	// Share button
	$$.button.share.click(function(e) {
		e.clientY -= 40
		ui.showContextMenu(e, $(this), 'share')
		return false
	})

	// Close Post
	$$.button.closePost.click(function() {
		ui.closePost()
	})

	$$.modal.markAllAsRead.button.click(function() {
		core.markAllAsRead(selected.feed)
		ui.showMarkAllAsRead()
	})

	// Mark all read
	$$.button.markAllAsRead.click(function() {
		ui.showMarkAllAsRead()
	})

	// Search
	$$.button.search.click(function() {
		ui.toggleSearch()
	})
	$$.bar.searchInput.keyup(function() {
		ui.search()
	})
	$$.bar.searchInput.keydown(function(e) {
		if (e.keyCode == 27) {
			ui.toggleSearch()
		}
	})

	// Because we can't use {display: none}
	$$.bar.searchInput.hide()


	$$.post.on('mouseenter', 'a', function() {
		var $this = $(this)
		$$.bar.linkUrl.html($this.attr('href'))
	})

	$$.post.on('mouseleave', 'a', function() {
		$('#link-url').empty()
	})


	// Feed context menu
	$$.column.feeds.on('contextmenu', function(e) {
		return false
	})
	$$.column.articles.on('contextmenu', function(e) {
		return false
	})

	$$.feeds.on('contextmenu', '.label header', function(e) {
		ui.showContextMenu(e, $(this), 'label')
	})

	$$.feeds.on('contextmenu', '.feed', function(e) {
		ui.showContextMenu(e, $(this), 'feed')

	})

	$$.articles.on('contextmenu', 'li', function(e) {
		ui.showContextMenu(e, $(this), 'article')
	})

	$(window).on('click', function(e) {
		ui.hideContextMenu()
		var $this = $(e.target),
			id = $this.attr('id')
		if (!_.string.startsWith(id, 'mark-all-as-read')) {
			$$.modal.markAllAsRead.el.fadeOut(150)
		}
	})

	$()

	$$.filters.el.find('li').click(function() {
		ui.selectFilter($(this))
	})




	// *************************************
	// *
	// * Settings
	// *
	// *************************************

	$$.settings.trigger.click(function() {
		cmd('settings')
	})

	$$.settings.exit.click(function() {
		$$.settings.el.hide()
		$$.overlay.hide()
	})

	$$.settings.reset.click(function() {
		storage.flush()
	})

	$$.settings.sync.interval.on('change', function() {
		settings.sync.interval = Number($(this).val())
		core.refreshOnTimer()
		storage.savePrefs()
	})
	$$.settings.sync.onStart.on('change', function() {
		settings.sync.onStart = $(this).prop('checked')
		storage.savePrefs()
	})
	$$.settings.keep.unread.on('change', function() {
		settings.keep.unread = Number($(this).val())
		storage.savePrefs()
	})
	$$.settings.keep.starred.on('change', function() {
		settings.keep.starred = Number($(this).val())
		storage.savePrefs()
	})
	$$.settings.keep.read.on('change', function() {
		settings.keep.read = Number($(this).val())
		storage.savePrefs()
	})
	$$.settings.notifications.on('change', function() {
		settings.notifications = $(this).prop('checked')
		storage.savePrefs()
	})
	$$.settings.max.special.on('change', function() {
		settings.max.special = Number($(this).val())
		storage.savePrefs()
	})
	$$.settings.max.read.on('change', function() {
		settings.max.read = Number($(this).val())
		storage.savePrefs()
	})
	$$.settings.autoInstapaperizer.on('change', function() {
		settings.autoInstapaperizer = $(this).prop('checked')
		storage.savePrefs()
	})
	$$.settings.nightMode.on('change', function() {
		ui.nightMode($(this).prop('checked'))
	})
	$$.settings.topToolbar.on('change', function() {
		ui.topToolbar($(this).prop('checked'))
	})
	$$.settings.rememberLastFeed.on('change', function() {
		settings.rememberLastFeed = $(this).prop('checked')
		storage.savePrefs()
	})

})
