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
from gi.repository import Indicate

# Note: it seems the messaging api has been improved greatly for Quantal [12.10]
# Unfortunately it isn't backwards compatible. The only decent reference I can find
# for now is https://wiki.edubuntu.org/MeetingLogs/devweek1208/libmessagingmenu

class LightreadIndicator:
    def __init__(self, main_app_window):
        self.main_app = main_app_window
        self.is_visible = False
        self.indicators = {}
        self.desktop_file = "/usr/share/applications/extras-lightread.desktop"

        # Create the base messaging server with the application name and icon
        self.server = Indicate.Server.ref_default()
        self.server.set_type("message.mail")
        self.server.set_desktop_file(self.desktop_file)
        self.server.connect("server-display", self.display_main_app)

        # Apparently if we don't provide a [valid] desktop file
        # the messaging menu displays our indicator as the top-level entry
        # which is exactly what I want to do here...
        # self.server.set_desktop_file("lightread.desktop")
        # self.ind = Indicate.Indicator()
        # self.ind.set_property("subtype", "mail")
        # self.ind.set_property("name", "Lightread")
        # self.ind.connect("user-display", self.display_main_app)

        # self.server.add_indicator(self.ind)

    def add_indicator(self, feed_id, feed_title, feed_count):
        if feed_id in self.indicators.keys():
            indicator = self.indicators[feed_id]
        else:
            indicator = Indicate.Indicator()
            indicator.set_property("subtype", "mail")
            indicator.set_property("name", feed_title)
            indicator.connect("user-display", self.display_feed, feed_id)
            self.indicators[feed_id] = indicator
            self.server.add_indicator(indicator)

        indicator.set_property('count', str(feed_count))
        indicator.set_property('draw-attention', 'true')
        indicator.show()

    def remove_indicator(self, feed_id):
        if feed_id in self.indicators.keys():
            indicator = self.indicators[feed_id]
            # indicator.set_property('count', '0')
            # indicator.set_property('draw-attention', 'false')
            # indicator.hide()
            self.server.remove_indicator(indicator)

    def new_mail(self, account, count):
        indicator = self.indicators[account]
        self.count += count
        indicator.set_property('count', str(self.count))
        indicator.set_property('draw-attention', 'true')
        indicator.show()

    def display_main_app(self, indicator, signal):
        is_visible = self.main_app.get_property("visible")
        if is_visible:
            self.main_app.present()
        else:
            self.main_app.show()

    def display_feed(self, indicator, signal, feed_id):
        self.display_main_app(indicator, signal)
        self.main_app.select_feed(feed_id)

    def hide(self):
        self.server.hide()
        self.is_visible = False

    def show(self):
        self.server.show()
        self.is_visible = True
