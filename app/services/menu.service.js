/**
 * menu.service.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.menu_service', ['WebtroPie.config_service','WebtroPie.es_service'])
        .service('MenuService', MenuService);

    MenuService.$inject = ['config','$http','util'];

    function MenuService(config, $http, util)
    {
        var self = this;

        self.exitMenu = exitMenu;
        self.goMenu = goMenu;
        self.hideMenu = hideMenu;
        self.init = init;
        self.menuKeyPress = menuKeyPress;
        self.showMenu = showMenu;
        self.toggleMenu = toggleMenu;
        activate();

        function activate()
        {
            self.menu = {};
            self.menu.history = [];
        }

        function exitMenu()
        {
            if (self.menu.history.length < 1)
            {
                hideMenu();
            }
            else
            {
                self.menu.template = self.menu.history[self.menu.history.length-1];
                self.menu.history.length--;
                focusFirstButton();
            }
        }

        function focusFirstButton()
        {
            util.waitForRender(self.appscope)
            .then(function() {
                var menu = angular.element(document.querySelector('#menu'));
                if (menu && menu.length > 0)
                {
                    var el = menu.find( "button" );
                    if (el)
                    for (var i = 0; i<el.length; i++)
                    {
                        if(!el[i].className)
                        {
                            el[i].focus();
                            break;
                        }
                    }
                }
            });

        }

        function goMenu(template)
        {
            self.menu.history.push(self.menu.template);
            self.menu.template = template;
            focusFirstButton();
        }

        function hideMenu()
        {
            self.menu.show = false;
            self.menu.history.length = 0;
        }

        function init()
        {
            self.menu.main = [
                {text: 'UI',      type: 'menu', action: 'menu/menu-ui.html'},
                {text: 'Helpbar', type: 'menu', action: 'menu/menu-helpbar.html'}
            ];
            if (config.local)
            {
                self.menu.main.push({text: 'Local',   type: 'menu', action: 'menu/menu-local.html'});
                self.menu.main.push({text: 'Uploads', type: 'menu', action: 'menu/menu-uploads.html'});
            }
            self.menu.main.push({text: 'Other', type: 'menu', action: 'menu/menu-other.html'});
            if (config.es.SaveGamelistsOnExit && config.env.es_pid)
            {
                showMenu('menu/es_warning.html');
            }
        }

        function menuKeyPress($event)
        {
            if ($event.keyCode == 27)  // Escape
            {
                exitMenu();
            }
        }

        function showMenu(template)
        {
            self.menu.template = template || 'menu/menu-main.html';
            self.menu.history.length = 0;
            self.menu.show = true;
            focusFirstButton();
        }

        function toggleMenu()
        {
            if (!self.menu.show)
            {
                showMenu();
            }
            else
            {
                hideMenu();
            }
        }
    }

})();
