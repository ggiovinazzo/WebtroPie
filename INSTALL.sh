#!/bin/bash

# ------------
# INSTALLATION
# ------------

cd `dirname $0`              # this (script) directory (relative)
WebtroPie=`pwd`              # this (script) directory (full)
SVR=$WebtroPie/app/svr       # external content (images etc) to web serve
LIB=$WebtroPie/app/lib       # external libs

echo "WebtroPie can either run under Apache or standalone"
echo
echo "To access Emulationstation files and write to gamelist file WebtroPie must run as 'pi' user."
echo "If you type 'y' the Apache RUN_USER will be changed from www-data to pi"
echo "and PHP upload limits are increased."
echo
echo "Running standalone runs in a single thread, no changes are made to Apache or PHP but"
echo "WebtroPie may not run as reponsively as under Apache"
echo
read -p "Install to Apache? [y/n]: " apache

# Make sure you have the packages below :-
if [ $apache == "y" ]; then
    # So the user doesn't have to manually install
    sudo apt-get -yqq install apache2 \
                  libapache2-mod-php7.1
    IP=`ifconfig | sed '/inet addr:.*255.255/!d;s|.*addr:|http://|;s|\s.*||'`
    echo
    read -p "Redirect ${IP} to ${IP}/app ? [y/n]: " redirect
    if [ $redirect == "y" ]; then
        if [ ! -s /var/www/html/index.html.orig ] ; then
            sudo cp /var/www/html/index.html /var/www/html/index.html.orig
        fi
        cp "$WebtroPie/redirect.html" /var/www/html/index.html
    fi
fi
echo
echo "Installing..."
echo
sudo apt-get -yqq install php7.1-gd php7.1-xml

#  fix permissions ?
sudo chown -R pi:www-data app
chown -f pi:www-data /dev/shm/runcommand.log
chown -f pi:www-data /dev/shm/retroarch.cfg
sudo find app -type f -exec chmod 664 {} \;
sudo find app -type d -exec chmod 775 {} \;

# create symlinks so we can web serve images and themes from the svr directory
sudo ln -sf /etc/emulationstation/themes                   $SVR
sudo ln -sf /home/pi/.emulationstation/downloaded_images   $SVR
sudo ln -sf /home/pi/RetroPie/roms                         $SVR

# download libs so that it can work offline in future
cd $LIB
rm -f angular*
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular.min.js.map
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-route.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-route.min.js.map
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-animate.min.js
wget -nc -nv https://ajax.googleapis.com/ajax/libs/angularjs/1.6.9/angular-animate.min.js.map

# Make a version of runcommand.sh that doesn't try pipe input from /dev/tty
sed 's/\(eval \$command\).*tty ./\1 \&/gi' \
    /opt/retropie/supplementary/runcommand/runcommand.sh > $SVR/runcommand.sh
chmod 755 $SVR/runcommand.sh

# create a php.ini with bigger upload limits
sed -f - /etc/php/7.1/apache2/php.ini > $WebtroPie/php.ini << SED_SCRIPT
  s|^;*\s*\(upload_max_filesize\s*=\).*$|\1 128M|gi
  s|^;*\s*\(post_max_size\s*=\).*$|\1 128M|gi
  s|^;*\s*\(memory_limit\s*=\).*$|\1 128M|gi
SED_SCRIPT

# create a php.ini for stand alone webserver with altered session settings
sed -f - $WebtroPie/php.ini > $WebtroPie/phpserver.ini << SED_SCRIPT
  s|^;*\s*\(session.name\s*=\).*$|\1 PHPSERVER|gi
  s|^;*\s*\(session.save_path\s*=\).*$|\1 $WebtroPie/sessions|gi
SED_SCRIPT

if [ $apache == "y" ]; then
    # APACHE

    # quick and dirty way to serve from apache http://192.168.?.?/app
    sudo ln -sf "$WebtroPie/app" /var/www/html/app

    # Make a backup php.ini (once)
    if [ ! -s /etc/php/7.1/apache2/php.ini.orig ] ; then
        sudo cp /etc/php/7.1/apache2/php.ini /etc/php/7.1/apache2/php.ini.orig
    fi

    # copy altered php.ini
    sudo cp "$WebtroPie/php.ini" /etc/php/7.1/apache2/php.ini

    # Make a backup envvars (once)
    if [ ! -s /etc/apache2/envvars.orig ] ; then
        sudo cp /etc/apache2/envvars /etc/apache2/envvars.orig
    fi

    # change both APACHE_RUN_USER and APACHE_RUN_GROUP
    # from www-data to pi
    sudo sed 's/\(APACHE_RUN_\(USER\|GROUP\)=\)www-data/\1pi/g' \
        /etc/apache2/envvars.orig > /etc/apache2/envvars
    # try to restart apache but may need a reboot if pid not found
    sudo apachectl restart

    echo "--------------------------------------------------------"
    echo "WebtroPie serving by Apache from ${IP}/app"
    echo "--------------------------------------------------------"

else
    # STAND ALONE PHP WEBSERVER

    cd "$WebtroPie"

    # Create local session directory owned by pi
    if [ ! -d "$WebtroPie/sessions" ] ; then
        mkdir "$WebtroPie/sessions"
        chown pi:www-data "$WebtroPie/sessions"
        chmod 755 "$WebtroPie/sessions"
    fi

    # must be run as pi (not root)
    if [ `whoami` != 'pi' ]; then
       echo "to run WebtroPie type :-"
       echo
       echo "./STANDALONE.sh"
    else
       ./STANDALONE.sh
    fi
fi

printf "\nReady\n\e[7m \e[0m\n"
