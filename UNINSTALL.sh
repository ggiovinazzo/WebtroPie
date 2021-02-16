#!/bin/sh

rm -f app/lib/angular*.js
rm -f app/svr/runcommand.sh
rm -f app/svr/themes
rm -f app/svr/downloaded_images
rm -f app/svr/roms
rm -f app/index.php
rm -f php.ini
rm -f phpserver.ini
sudo rm /var/www/html/app

if [ -s /var/www/html/index.html.orig ] ; then
    sudo cp /var/www/html/index.html /var/www/html/index.html.bak
    sudo mv /var/www/html/index.html.orig /var/www/html/index.html
fi

if [ -s /etc/apache2/envvars.orig ] ; then
    sudo cp /etc/apache2/envvars /etc/apache2/envvars.bak
    sudo mv /etc/apache2/envvars.orig /etc/apache2/envvars
fi

if [ -s /etc/php5/apache2/php.ini.orig ] ; then
    sudo cp /etc/php5/apache2/php.ini /etc/php5/apache2/php.ini.bak
    sudo mv /etc/php5/apache2/php.ini.orig /etc/php5/apache2/php.ini
fi

if [ -d sessions ] ; then
    rm -rf sessions
fi

