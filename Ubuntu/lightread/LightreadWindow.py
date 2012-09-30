# -*- Mode: Python; coding: utf-8; indent-tabs-mode: nil; tab-width: 4 -*-
### BEGIN LICENSE
# Copyright (C) 2012 Caffeinated Code <caffeinatedco.de>
# Copyright (C) 2012 George Czabania
# Copyright (C) 2012 Jono Cooper
# Copyright (c) The Regents of the University of California.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
# 1. Redistributions of source code must retain the above copyright
#    notice, this list of conditions and the following disclaimer.
# 2. Redistributions in binary form must reproduce the above copyright
#    notice, this list of conditions and the following disclaimer in the
#    documentation and/or other materials provided with the distribution.
# 3. Neither the name of the University nor the names of its contributors
#    may be used to endorse or promote products derived from this software
#    without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED.  IN NO EVENT SHALL THE REGENTS OR CONTRIBUTORS BE LIABLE
# OR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
# OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
# HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
# LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
# OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
# SUCH DAMAGE.
### END LICENSE

import logging
logger = logging.getLogger('lightread')

import urllib

import gettext
from gettext import gettext as _
gettext.textdomain('lightread')

import subprocess, os, json
from gi.repository import Gtk, Gdk, WebKit, Notify, Soup  # pylint: disable=E0611
try:
    from gi.repository import Unity, Dbusmenu
except ImportError:
    pass

from lightread_lib import Window
from lightread_lib.helpers import get_media_file
from lightread.AboutLightreadDialog import AboutLightreadDialog
try:
    from lightread.LightreadIndicator import LightreadIndicator
except ImportError:
    pass

# Get Storage Location for SQLite
from xdg.BaseDirectory import *
sql_db_path = os.path.join(xdg_data_home, 'com.caffeinatedcode.lightread');

if not os.path.exists(sql_db_path):
    os.makedirs(sql_db_path)

sql_db_path = os.path.join(sql_db_path, 'db.sqlite3')

# Set up SQLite database
import sqlite3 as sq
sql_connection = sq.connect(sql_db_path)
sql_cursor = sql_connection.cursor()

# Check for sharingsupport - make sure that gwibber-poster is in PATH
sharingsupport = os.path.isfile("/usr/bin/gwibber-poster")


# See lightread_lib.Window.py for more details about how this class works
class LightreadWindow(Window):
    __gtype_name__ = "LightreadWindow"

    def select_feed(self, feed_id):
        select_args = {'feedID': feed_id}
        js_comm = 'cmd("%s", %s)' % ('select-feed', json.dumps(select_args))
        self.webview.execute_script(js_comm)

    def inspect_webview(self, inspector, widget, data=None):
        inspector_view = WebKit.WebView()
        self.inspector_window.add(inspector_view)
        self.inspector_window.resize(800, 400)
        self.inspector_window.show_all()
        self.inspector_window.present()
        return inspector_view

    def finish_initializing(self, builder):  # pylint: disable=E1002
        """Set up the main window"""
        super(LightreadWindow, self).finish_initializing(builder)

        # We'll need to keep track of the indicator and handler later, so declare them here
        self.indicator = None
        self.window_close_handler = None

        self.AboutDialog = AboutLightreadDialog
        self.scroller = self.builder.get_object("scroller")

        #Enables Cookies
        session = WebKit.get_default_session()
        cache = os.path.join(xdg_data_home, 'com.caffeinatedcode.lightread')
        cookie_jar = Soup.CookieJarText.new(os.path.join(cache, 'WebkitSession'), False)
        session.add_feature(cookie_jar)
        session.props.max_conns_per_host = 8


        self.webview = WebKit.WebView()
        self.scroller.add(self.webview)
        self.webview.props.settings.enable_default_context_menu = False
        self.webviewsettings = self.webview.get_settings()
        self.webviewsettings.set_property("javascript-can-open-windows-automatically", True)
        self.webviewsettings.set_property("enable-universal-access-from-file-uris", True)
        self.webviewsettings.set_property("enable-developer-extras", True)
        self.webview.load_uri(get_media_file('app/index.html'))

        self.webview_inspector = self.webview.get_inspector()
        self.webview_inspector.connect('inspect-web-view', self.inspect_webview)
        self.inspector_window = Gtk.Window()

        self.webview.show()

        #Menubar
        self.add = self.builder.get_object("add")
        self.refresh = self.builder.get_object("refresh")
        self.star = self.builder.get_object("star")
        self.read = self.builder.get_object("read")
        self.logout = self.builder.get_object("logout")
        self.next_article = self.builder.get_object("next-article")
        self.prev_article = self.builder.get_object("prev-article")
        self.filter_all = self.builder.get_object("filter-all")
        self.filter_unread = self.builder.get_object("filter-unread")
        self.filter_starred = self.builder.get_object("filter-starred")

        # Unity Support
        Notify.init('Lightread')
        self.notification = Notify.Notification.new('Lightread', '', 'lightread')

        try:
            launcher = Unity.LauncherEntry.get_for_desktop_id("extras-lightread.desktop")

            ql = Dbusmenu.Menuitem.new()
            updatenews = Dbusmenu.Menuitem.new()
            updatenews.property_set(Dbusmenu.MENUITEM_PROP_LABEL, "Update News")
            updatenews.property_set_bool(Dbusmenu.MENUITEM_PROP_VISIBLE, True)
            ql.child_append(updatenews)
            launcher.set_property("quicklist", ql)
        except NameError:
            pass

        # Message Passing Stuff
        def reload_feeds(this, widget, data=None):
            self.webview.execute_script('cmd("refresh")')

        def menuexternal(this, widget, data=None):
            print(this)
            print(this.get_name())
            self.webview.execute_script('cmd("' + this.get_name() + '")')

        def _navigation_requested_cb(view, frame, networkRequest):
            uri = networkRequest.get_uri()

            if uri[:26] != 'http://www.instapaper.com/':
                subprocess.Popen(['xdg-open', uri])
                return 1
            return

        def console_message_cb(widget, message, line, source):
            logger.debug('%s:%s "%s"' % (source, line, message))
            return True

        def sql_exec(command):
            if command.startswith("SELECT"):
                return sql.select(command)
            else:
                sql.execute(command)
                return []

        def title_changed(widget, frame, title):
            if title != 'null':

                INDICATOR = "!COMMAND!"
                if title.startswith(INDICATOR):
                    try:
                        instructions = json.loads(title[len(INDICATOR):])
                    except:
                        return

                    # Execute SQL here
                    if "sql" in instructions['command']:
                        retval = sql_exec(instructions['command']['sql'])
                        self.webview.execute_script('window.py_ctrl.receive("%s", %s)' % (instructions['id'], json.dumps(retval)))

                    # Commit SQL to disk
                    if "commit" in instructions['command']:
                        sql_connection.commit()

                    return

                print title
                title = title.split("|")

                #Gets Data from Disk
                if title[0] == 'count':
                    try:
                        if int(title[1]) == 0:
                            launcher.set_property("count_visible", False)
                            self.set_title("Lightread")
                        else:
                            launcher.set_property("count_visible", True)
                            self.set_title(title[1] + " - Lightread")

                        launcher.set_property("count", int(title[1]))
                    except UnboundLocalError:
                        pass

                elif title[0] == 'notify':
                    # Update notification and show only if not changed and window not focused
                    if self.notification.get_property('body') != title[2]:
                        if self.is_active() is not True:
                            self.notification.set_property('body', title[2])
                            self.notification.show()

                elif title[0] == 'copy':
                    clipboard = Gtk.Clipboard.get(Gdk.SELECTION_CLIPBOARD)
                    clipboard.set_text(title[1], -1)
                    clipboard.store()

                elif title[0] == 'gwibber':
                    if sharingsupport:
                        subprocess.call(["/usr/bin/gwibber-poster", "--message", title[1]])

                elif title[0] == 'settings':

                    settings_json = json.loads(title[1])

                    if settings_json.get('indicators') is True:
                        if self.indicator is None:
                            self.indicator = LightreadIndicator(self)
                        self.indicator.show()
                    elif settings_json.get('indicators') is False and self.indicator is not None:
                        # indicator set to false but was already created: hide it
                        self.indicator.hide()

                    # if settings background true and not self.is connected delete-event
                    if settings_json.get('background') is True and self.window_close_handler is None:
                        self.window_close_handler = self.connect('delete-event', self._on_delete_event)
                    elif settings_json.get('background') is False and self.window_close_handler is not None:
                        self.disconnect(self.window_close_handler)
                        self.window_close_handler = None

                elif title[0] == 'feed_count':
                    if self.indicator is not None:
                        feed_json = json.loads(title[1])
                        count = int(feed_json['count'])
                        if count > 0:
                            self.indicator.add_indicator(urllib.unquote(feed_json['id']), urllib.unquote(feed_json['title']), count)
                        else:
                            self.indicator.remove_indicator(urllib.unquote(feed_json['id']))

        # Connects to WebView
        self.webview.connect('title-changed', title_changed)
        self.webview.connect('navigation-requested', _navigation_requested_cb)
        self.webview.connect('console-message', console_message_cb)

        self.add.connect("activate", menuexternal, None)
        self.refresh.connect("activate", menuexternal, None)
        self.star.connect("activate", menuexternal, None)
        self.read.connect("activate", menuexternal, None)
        self.logout.connect("activate", menuexternal, None)
        self.next_article.connect("activate", menuexternal, None)
        self.prev_article.connect("activate", menuexternal, None)
        self.filter_all.connect("activate", menuexternal, None)
        self.filter_unread.connect("activate", menuexternal, None)
        self.filter_starred.connect("activate", menuexternal, None)
        try:
            updatenews.connect("item-activated", reload_feeds, None)
        except UnboundLocalError:
            pass

    def _on_delete_event(self, widget, event):
        """ Use PyGTK's hide_on_delete [http://www.pygtk.org/docs/pygtk/class-gtkwidget.html#method-gtkwidget--hide-on-delete]
        to stop the window's close button from actually closing, and simply hiding instead.
        This allows us to keep lightread running in the background. Clicking on the lightread indicator will call window.show()
        and display the main lightread window. """
        return self.hide_on_delete()
