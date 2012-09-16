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

class LightreadIndicator:
    def __init__(self, main_app_window):
        self.main_app = main_app_window

        self.server = Indicate.Server.ref_default()         
        self.server.set_type("message.mail")

        # Apparently if we don't provide a [valid] desktop file
        # the messaging menu displays our indicator as the top-level entry
        # which is exactly what I want to do here... 
        # self.server.set_desktop_file("lightread.desktop")
        
        self.ind = Indicate.Indicator()
        self.ind.set_property("subtype", "mail")
        self.ind.set_property("name", "Lightread")
        self.ind.connect("user-display", self.display_main_app)
        
        self.server.add_indicator(self.ind)
        
        self.server.show()

    def set_unread_count(self, unread_count):
        self.ind.set_property("count", str(unread_count))
        self.ind.set_property("draw-attention", 'true')

        self.ind.show()

    def display_main_app(self, indicator, signal):
        is_visible = self.main_app.get_property("visible")
        if is_visible:
            self.main_app.present()
        else:
            self.main_app.show()
            