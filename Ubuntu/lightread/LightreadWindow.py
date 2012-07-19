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

import gettext
from gettext import gettext as _
gettext.textdomain('lightread')

from gi.repository import Gtk, Gdk, WebKit, Unity, Notify, Dbusmenu# pylint: disable=E0611
import logging, webbrowser
logger = logging.getLogger('lightread')

from lightread_lib import Window
from lightread_lib.helpers import get_media_file
from lightread.AboutLightreadDialog import AboutLightreadDialog

"""try:
    from gi.repository import GwibberGtk
    sharingsupport = 'true'
except ImportError:
    pass
"""

# See lightread_lib.Window.py for more details about how this class works
class LightreadWindow(Window):
    __gtype_name__ = "LightreadWindow"
    
    def finish_initializing(self, builder): # pylint: disable=E1002
        """Set up the main window"""
        super(LightreadWindow, self).finish_initializing(builder)

        self.AboutDialog = AboutLightreadDialog
        self.scroller = self.builder.get_object("scroller")

        self.webview = WebKit.WebView()
        self.scroller.add(self.webview)
        self.webview.props.settings.enable_default_context_menu = False
        self.webviewsettings = self.webview.get_settings()
        self.webviewsettings.set_property("javascript-can-open-windows-automatically", True)
        self.webviewsettings.set_property("enable-universal-access-from-file-uris", True)
        self.webview.load_uri(get_media_file('app/index.html'))
        
        self.webview.show()

        #Menubar
        self.add = self.builder.get_object("add")
        self.refresh = self.builder.get_object("refresh")
        self.star = self.builder.get_object("star")
        self.read = self.builder.get_object("read")
        self.share = self.builder.get_object("share")
        self.logout = self.builder.get_object("logout")
        self.next_article = self.builder.get_object("next-article")
        self.prev_article = self.builder.get_object("prev-article")
        self.filter_all = self.builder.get_object("filter-all")
        self.filter_unread = self.builder.get_object("filter-unread")
        self.filter_starred = self.builder.get_object("filter-starred")


        # Unity Support
        Notify.init('Lightread')
        launcher = Unity.LauncherEntry.get_for_desktop_id ("lightread.desktop")

        ql = Dbusmenu.Menuitem.new ()
        updatenews = Dbusmenu.Menuitem.new ()
        updatenews.property_set (Dbusmenu.MENUITEM_PROP_LABEL, "Update News")
        updatenews.property_set_bool (Dbusmenu.MENUITEM_PROP_VISIBLE, True)
        ql.child_append (updatenews)
        launcher.set_property("quicklist", ql)

        # Message Passing Stuff
        def menuexternal(this, widget, data = None):
            print this
            print this.get_name()
            self.webview.execute_script('cmd("' + this.get_name() + '")')

        def _navigation_requested_cb(view, frame, networkRequest):
            uri = networkRequest.get_uri()
            if uri[:7] != 'file://':
                webbrowser.open(uri)
            return 1
        

        def title_changed(widget, frame, title):
            if title != 'null':

                title = title.split("|")

                #Gets Data from Disk
                if title[0] == 'count':
                    launcher.set_property("count", int(title[1]))
                    launcher.set_property("count_visible", True)

                elif title[0] == 'notify':
                    notification = Notify.Notification.new(
                        title[1],
                        title[2],
                        get_media_file('lightread.svg')
                    )
                    notification.show()

                elif title[0] == 'copy':
                    clipboard = Gtk.Clipboard.get(Gdk.SELECTION_CLIPBOARD)
                    clipboard.set_text(title[1], -1)
                    clipboard.store()

                elif title[0] == 'reload':
                    print "Reloading"
                    self.webview.reload()
                    self.webview.load_uri(get_media_file('app/index.html'))

                """elif title[0] == 'share':
                    if sharingsupport == 'true':
                        share = Gtk.Window()
                        share.set_title("Share")
                        share.set_icon_name("gwibber")
                        share.resize(400, 150)
                        entry = GwibberGtk.Entry()
                        share.add(entry)
                        share.show_all()
                        share.present()"""

        # Connects to WebView
        self.webview.connect('title-changed', title_changed)
        self.webview.connect('navigation-requested', _navigation_requested_cb)

        self.add.connect ("activate", menuexternal, None)
        self.refresh.connect ("activate", menuexternal, None)
        self.star.connect ("activate", menuexternal, None)
        self.read.connect ("activate", menuexternal, None)
        self.share.connect ("activate", menuexternal, None)
        self.logout.connect ("activate", menuexternal, None)
        self.next_article.connect ("activate", menuexternal, None)
        self.prev_article.connect ("activate", menuexternal, None)
        self.filter_all.connect ("activate", menuexternal, None)
        self.filter_unread.connect ("activate", menuexternal, None)
        self.filter_starred.connect ("activate", menuexternal, None)