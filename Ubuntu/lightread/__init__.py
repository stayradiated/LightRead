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

import optparse

import gettext
from gettext import gettext as _
gettext.textdomain('lightread')

from gi.repository import Gtk, Gio # pylint: disable=E0611

from lightread import LightreadWindow

from lightread_lib import set_up_logging, get_version

class LightreadApp(Gtk.Application):
    """ Wrap lightread in a Gtk.Application instance which by default allows only single instances of applications."""
    def __init__(self):
        Gtk.Application.__init__(self, application_id="org.stayradiated.lightread", flags=Gio.ApplicationFlags.FLAGS_NONE)
        self.connect("activate", self.on_activate)

    def on_activate(self, data=None):
        """
        Check if the application has been activated previously by looking for the LightreadWindow
        attached to the application. If one is found just bring it to the front with present().
        If no windows are attached then this must be the first lightread activation... so start it up.
        """
        # Try and get any windows belonging to this application.
        existing_windows = self.get_windows()

        if (len(existing_windows) > 0):
            # Lightread instance already exists so just bring it to the front.
            existing_windows[0].present()
        else:
            # No pre-existing instance, startup regularly.
            parse_options()
            # Startup the main lightread window.
            window = LightreadWindow.LightreadWindow()
            # Connect the window to our application so other instances can find it and bring it to the front.
            window.set_application(self)
            window.show()
            Gtk.main()

def parse_options():
    """Support for command line options"""
    parser = optparse.OptionParser(version="%%prog %s" % get_version())
    parser.add_option(
        "-v", "--verbose", action="count", dest="verbose",
        help=_("Show debug messages (-vv debugs lightread_lib also)"))
    (options, args) = parser.parse_args()

    set_up_logging(options)

def main():
    app = LightreadApp()
    app.run(None)
