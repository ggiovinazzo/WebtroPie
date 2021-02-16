/**
 * main app controller
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie')
        .controller('AppController', controller);

    controller.$inject = ['$scope','$window','$http','config','util','styler',
                            'ThemeService','GameService','CarouselService','ES','MenuService',
                            'ThemerService'];
        
    function controller($scope, $window, $http, config, util, styler,
                            ThemeService, GameService, CarouselService, ES, MenuService,
                            ThemerService)
    {
        var app = this;

        // methods
        app.appConfigChanged = appConfigChanged;
        app.deleteGame = deleteGame;
        app.goWiki = goWiki;
        app.languageChanged = languageChanged;
        app.registerThemeChangedCallback = registerThemeChangedCallback;
        app.setViewAnimation = setViewAnimation;
        app.stopES = ES.stop;
        app.themeChanged = themeChanged;
        app.viewTransitionChanged = viewTransitionChanged;
        app.viewStyleChanged = viewStyleChanged;

        // menu methods moved to service
        app.exitMenu = MenuService.exitMenu;
        app.goMenu = MenuService.goMenu;
        app.hideMenu = MenuService.hideMenu;
        app.menuKeyPress = MenuService.menuKeyPress;
        app.showMenu = MenuService.showMenu;
        app.toggleMenu = MenuService.toggleMenu;

        activate();

        function activate()
        {          
            // Services (make services globally avilable via app)
            app.config = config;
            app.util = util;
            app.ThemeService = ThemeService;
            app.GameService = GameService;
            app.styler = styler;
            app.CarouselService = CarouselService;
            app.ES = ES;
            app.menu = MenuService.menu;
            MenuService.appscope = $scope;

            config.init()
            .then(function () {
                ES.init();
                MenuService.init();
            });

            angular.element($window).bind("keydown", util.keyPress);
            angular.element($window).bind("keyup", util.keyRelease); 
        }

        function appConfigChanged(field)
        {
            config.save(field, config.app[field], 'string', config.APP);
        }

        function deleteGame(game)
        {
            app.gameToDelete = game;
            app.deleteROM = true;
            MenuService.showMenu('menu/deleteGame.html');
        }

        function goWiki()
        {
            $window.open('https://github.com/gazpan/WebtroPie/wiki', '_blank');
        }

        function languageChanged()
        {
            config.save('Language', config.app.Language, 'string', config.APP);
            config.load(config.LANG, config.app.Language, true)
            .then(function() {
                GameService.setLanguage();
                ES.setLanguage();
            });
        }

        function registerThemeChangedCallback(callback)
        {
            app.themeChangedCallback = callback;
        }

        function setViewAnimation(anim_class)
        {
            var view_el = angular.element(document.querySelector('#mainview'));
            var classes = ['fade','slideleft','slideright','slideup','slidedown'];
            angular.forEach(classes, function(c) {
                if (c != anim_class )
                {
                    view_el.removeClass(c);
                }
            });
            if (anim_class)
            {
                app.animate_view_class = anim_class;
                view_el.addClass(anim_class);
            }
            else
            {
                app.animate_view_class = '';                  
            }
        }

        function themeChanged(theme)
        {
            ThemerService.setElement(null);

            if (theme)
            {
                config.app.ThemeSet = theme;
                config.themehover = false;
            }
            else
            {
                MenuService.hideMenu();
            }

            ThemeService.getTheme(config.app.ThemeSet, CarouselService.getCurrentCarouselSystemName(), ThemeService.view.name)
            .then(function()
            {
                // only save if it actually worked
                if (config.app.ThemeSet == ThemeService.theme.name)
                {
                    config.save('ThemeSet', config.app.ThemeSet, 'string', config.APP);
                }
                CarouselService.createCarouselSystems(ThemeService.theme);

                // choose best view
                GameService.checkSystemTheme(ThemeService.system.name, true);

                if (app.themeChangedCallback)
                {
                    app.themeChangedCallback();
                }
            });
        }

        function viewTransitionChanged()
        {
            config.save('ViewTransitions', config.app.ViewTransitions, 'string', config.APP);
            ThemeService.setCurrentSystem();
        }

        function viewStyleChanged()
        {
            ThemeService.switchView(config.app.ViewStyle);
            config.save('ViewStyle', config.app.ViewStyle, 'string', config.APP);
        }
    }

})();
