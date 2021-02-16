/**
 * gamelist.view.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.gamelist_view', ['ngRoute'])
        .controller('GamelistViewController', controller);

    controller.$inject = ['$scope','config','util','styler',
                          'ThemeService','GameService','CarouselService','MenuService','ES',
                          '$routeParams','$window','$document','$timeout'];

    function controller($scope, config, util, styler,
                        ThemeService, GameService, CarouselService, MenuService, ES,
                        $routeParams, $window, $document, $timeout)
    {
        var page = this;

        // member functions
        page.filterChange     = filterChange;
        page.goBack           = goBack;
        page.goNextSystem     = goNextSystem;
        page.goPreviousSystem = goPreviousSystem;
        page.keyPress         = keyPress;
        page.matchMedia       = matchMedia;
        page.scan             = scan;
        page.showFavoriteOn   = showFavoriteOn;
        page.showFavoriteOff  = showFavoriteOff;
        page.showNestedOn     = showNestedOn;
        page.showNestedOff    = showNestedOff;

        // member variables
        page.system = $routeParams.system;  // E.g amstradcpc
        page.subdir = $routeParams.subdir;

        page.helpmenu = 
           [{langButton: 'options', svg: 'resources/button_select.svg',
                   menu: [{text: 'Scan',       click: scan},
                          {text: 'MatchMedia', click: matchMedia}]}
           ,{langButton: 'menu',  click: MenuService.toggleMenu,  svg: 'resources/button_start.svg'}
           ,{langButton: 'back',  click: goBack,                  svg: 'resources/button_b.svg'}

           // X on the menu reflects the key enter / mouse click action

           // for a Game, X = Edit, A = Launch (if enabled)
/*
           ,{langButton: 'edit',  click: GameService.showEditor, svg: 'resources/button_a.svg',
                                   show: '!app.GameService.game.isDir && app.config.edit'}
*/
           ,{langButton: 'launch',click: GameService.launch,      svg: 'resources/button_x.svg',
                                   show: '!app.GameService.game.isDir && app.config.env.has_launch && app.config.app.ShowLaunch'},

            // for a Directory, X = Open, A = Edit
           ,{langButton: 'open',  click: GameService.openFolder, svg: 'resources/button_a.svg',
                                   show: 'app.GameService.game.isDir'}
           ,{langButton: 'edit',  click: GameService.showEditor, svg: 'resources/button_x.svg',
                                   show: 'app.GameService.game.isDir && app.config.edit'}

           ,{                     click: showFavoriteOn,  svg: 'resources/favorite-o.svg',
                                   show: '!app.GameService.show_favorite'}
           ,{                     click: showFavoriteOff, svg: 'resources/favorite.svg',
                                   show: 'app.GameService.show_favorite', color: "DD3000"}

           ,{                     click: showNestedOn,  svg: 'resources/folder-o.svg',
                                   show: "app.GameService.system_name.substring(0,5)!='auto-' && !app.GameService.show_nested"}
           ,{                     click: showNestedOff, svg: 'resources/folder.svg',
                                   show: "app.GameService.system_name.substring(0,5)!='auto-' && app.GameService.show_nested"}
           ];

        activate();

        function activate()
        {
            page.loaded = false;

            ThemeService.viewscope = page;

            $scope.app.registerThemeChangedCallback(null);

            // wait for config (which theme?)
            config.init()
            .then(function(response)
            {
                var default_view = GameService.getDefaultGamelistViewName(page.system);
                return ThemeService.themeInit(page.system, default_view, !!config.app.ScanAtStartup);
            })
            .then(function(theme_output)
            {
                CarouselService.createCarouselSystems(ThemeService.theme);

                var default_view = GameService.getDefaultGamelistViewName(page.system);
                ThemeService.setSystem(page.system, default_view);

                CarouselService.setCarouselSystemIndexByName(page.system);

                if (config.app.WaitForAnimations &&
                    $scope.app.animate_view_class &&
                    $scope.app.animate_view_class.substring(0,5) == 'slide' &&
                   (!GameService.systems[page.system] ||
                     GameService.systems[page.system].total > 500))
                {
                    $timeout(function() {
                        page.loaded = true;
                        if (GameService.filter)
                            util.focus('#filter');
                    }, 600)
                }
                else
                {
                    page.loaded = true;
                    if (GameService.filter)
                        util.focus('#filter');
                }

                util.register_keyPressCallback(keyPress, $scope);

                $scope.$watch('app.GameService.show_favorite', filterChange);
                $scope.$watch('app.GameService.show_nested', filterChange);
                $scope.$watch('app.GameService.filter', filterChange);
            });
        }

        function filterChange()
        {
            if (page.checkGameStillVisible)
            {
                page.checkGameStillVisible();
            }
            $scope.$evalAsync();
        }

        function goBack()
        {
            ThemeService.playSound('back');
            if ( config.app.ViewTransitions=='Fade' )
            {
                $scope.app.setViewAnimation('fade');
            }
            else if ( config.app.ViewTransitions=='Slide' )
            {
                $scope.app.setViewAnimation('slidedown');
            }

            $scope.app.hideMenu();

            GameService.saveState();

            var parent_path = '/';
            if (GameService.subdir)
            {
                // stay within this system
                parent_path += ThemeService.system.name;

                // find parent directory
                GameService.subdir = GameService.getParentDir(GameService.subdir);
                // still under a subdirectory?
                if (GameService.subdir)
                {
                    parent_path += '/' + GameService.subdir;
                }
            }
            util.back(parent_path);
            // TODO: just restore saved values
            //page.checkGameStillVisible();

            return true;
        }

        function goNextSystem()
        {
            if ( config.app.ViewTransitions=='Fade' )
            {
                $scope.app.setViewAnimation('fade');
            }
            else if ( config.app.ViewTransitions=='Slide' )
            {
                $scope.app.setViewAnimation('slideleft');
            }
            GameService.saveState();
            CarouselService.goNextCarouselSystemGamelist(true);
        }

        function goPreviousSystem()
        {
            if ( config.app.ViewTransitions=='Fade' )
            {
                $scope.app.setViewAnimation('fade');
            }
            else if ( config.app.ViewTransitions=='Slide' )
            {
                $scope.app.setViewAnimation('slideright');
            }
            GameService.saveState();
            CarouselService.goPreviousCarouselSystemGamelist(true);
        }

        function keyPress($event)
        {
            // do normal input behaviour for input/textarea
            if($event.target.tagName == 'INPUT' || $event.target.tagName == 'TEXTAREA')
            {
                // unless filter is empty so that left right goes to new screen
                if( ! ($event.target.id == 'filter' && !GameService.filter) )
                {
                    return true;
                }
            }

            $event.stopPropagation();

            // Ctrl - M - Main Menu
            if (($event.ctrlKey || util.commandDown) && $event.keyCode == 77)
            {
                MenuService.toggleMenu();
                return true;
            }

            if (!GameService.filter || $document[0].activeElement.id != 'filter')
            {
                if ($event.keyCode == 39)         // right arrow: system right
                {
                    goNextSystem();
                    return true;
                }
                else if ($event.keyCode == 37)  // left arrow: system left
                {
                    goPreviousSystem();
                    return true;
                }
                // type a character while focus is on the game list :-
                // focus on 'filter' and enter key char in filter field
                else if ( !GameService.filter &&
                             !$event.shiftKey && !$event.ctrlKey && !$event.altKey &&
                             ( ($event.keyCode >= 48 && $event.keyCode <= 57) ||  // 0-9
                                ($event.keyCode >= 65 && $event.keyCode <= 90)) )  // a-z
                {
                    GameService.filter = String.fromCharCode(event.keyCode);
                    util.focus('#filter');
                    $event.preventDefault();
                    return;
                }
            }

            if ($event.keyCode == 13)          // enter
            {
                // if it's a directoy go to sub directory
                // otherwise open game metadata editor
                if (GameService.game.func)
                {
                    return GameService.game.func();
                }
                else if (GameService.game.isDir)
                {
                    return GameService.openFolder();
                }
                else
                {
                    return GameService.showEditor();
                }
            }
            else if ($event.keyCode == 27)     // Escape
            {
                // close editor if open
                if (GameService.edit)
                {
                    return GameService.hideEditor();
                }
                // clear filter
                else if (GameService.filter)
                {
                    GameService.filter = '';
                }
                // go systems view
                else
                {
                    return goBack();
                }
            }

            return GameService.keyPress($event);
        }

        function showFavoriteOn()
        {
            GameService.show_favorite = true;
        }

        function showFavoriteOff()
        {
            GameService.show_favorite = false;
        }

        function showNestedOn()
        {
            GameService.show_nested = true;
        }

        function showNestedOff()
        {
            GameService.show_nested = false;
        }

        function scan()
        {
            var game = GameService.game;
            GameService.getSystemGamelist(page.system, true)
            .then(function(gamelist) {
                util.waitForRender($scope).then(function() {
                    GameService.game = game;
                    page.checkGameStillVisible();
                });
            });
        }

        function matchMedia()
        {
            GameService.getSystemGamelist(page.system, false, true);
        }
    }

})();
