
/*jshint asi: true*/

key.filter = function (event){
	if (selected.menu) return false
	var tagName = (event.target || event.srcElement).tagName;
	return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA')
}

key('space', function() {
	return false
})


// Scope: Feeds
key('down', 'feeds', function() {
	ui.nextFeed()
	return false
})

key('up', 'feeds', function() {
	ui.prevFeed()
	return false
})

key('enter, x', 'feeds', function() {
	ui.toggleLabel()
})


// Scope: Articles
key('down, space', 'articles', function() {
	ui.nextArticle()
	return false
})

key('up, shift+space', 'articles', function() {
	ui.prevArticle()
	return false
})

key('enter', 'articles', function() {
	ui.openHoverArticle()
})


// Scope: Post
key('down', 'post', function() {
	ui.scrollDown()
	return false
})

key('up', 'post', function() {
	ui.scrollUp()
	return false
})

key('space', 'post', function() {
	ui.scrollDown('page')
	return false
})

key('shift+space', 'post', function() {
	ui.scrollUp('page')
	return false
})


// Scope: All
key('left', function() {
	ui.moveScope('left')
	return false
})

key('right', function() {
	ui.moveScope('right')
	return false
})

key('j', function() {
	ui.nextArticle()
})

key('k', function() {
	ui.prevArticle()
})

key('n', function() {
	ui.nextArticle('scan')
	return false
})

key('p', function() {
	ui.prevArticle('scan')
	return false
})

key('shift+n', function() {
	ui.nextFeed()
	return false
})

key('shift+p', function() {
	ui.prevFeed()
	return false
})

key('m', function() {
	cmd('read')
	return false
})

key('s', function() {
	cmd('star')
	return false
})

key('v', function() {
	cmd('view')
	return false
})

key('r', function() {
	cmd('refresh')
	return false
})

key('a', function() {
	cmd('add')
	return false
})

key('/, s', function() {
	ui.toggleSearch()
	return false
})

key('shift+a', function() {
	cmd('markAllAsRead')
	return false
})

key('o', function() {
	ui.openHoverArticle()
	return false
})

key.setScope('feeds')