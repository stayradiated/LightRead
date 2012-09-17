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

import dbus.service
from dbus.mainloop.glib import DBusGMainLoop
DBusGMainLoop(set_as_default=True)

import gettext
from gettext import gettext as _
gettext.textdomain('lightread')

from gi.repository import Gtk # pylint: disable=E0611

from lightread import LightreadWindow

from lightread_lib import set_up_logging, get_version

class LightreadDBusService(dbus.service.Object):
    """ Registers a service on the dbus and listens for proxied requests.
        When lightread attempts to startup multiple instances, simply proxy a request
        to the service's bring_to_front method instead.
    """
    def __init__(self, lightread_window):
        bus_name = dbus.service.BusName('org.stayradiated.lightread', bus=dbus.SessionBus())
        dbus.service.Object.__init__(self, bus_name, '/org/stayradiated/lightread')
        self.lightread_window = lightread_window

    @dbus.service.method(dbus_interface='org.stayradiated.lightread')
    def bring_to_front(self):
        """Pushes the LightreadWindow to the front to be visible"""
        self.lightread_window.present()

def parse_options():
    """Support for command line options"""
    parser = optparse.OptionParser(version="%%prog %s" % get_version())
    parser.add_option(
        "-v", "--verbose", action="count", dest="verbose",
        help=_("Show debug messages (-vv debugs lightread_lib also)"))
    (options, args) = parser.parse_args()

    set_up_logging(options)

def main():
    # We're going to force having only a single instance of lightread up at a time:
    # First check the dbus to see if an instance of lightread has already been started
    if dbus.SessionBus().request_name('org.stayradiated.lightread') != dbus.bus.REQUEST_NAME_REPLY_PRIMARY_OWNER:
        # If we have an existing instance: find its entry in the dbus
        bus = dbus.SessionBus()
        existing_instance = bus.get_object('org.stayradiated.lightread', '/org/stayradiated/lightread')
        bring_to_front = existing_instance.get_dbus_method('bring_to_front', 'org.stayradiated.lightread')
        # Make a proxy call to the bring_to_front() method on the existing instance
        bring_to_front()
    else:
        # No pre-existing instance, startup regularly.
        parse_options()

        # Run the application.
        window = LightreadWindow.LightreadWindow()

        # Initialize our dbus service and pass it the window instance.
        lightreadDBusService = LightreadDBusService(window)
        
        window.show()
        Gtk.main()
        
