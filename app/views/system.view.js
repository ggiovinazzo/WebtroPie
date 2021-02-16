/**
 * system.view.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.system_view', ['ngRoute','ngTouch'])
        .controller('SystemViewController',controller);

    controller.$inject = ['$scope','$window','$timeout',
                          'config', 'styler', 'util', 'MenuService',
                          'ThemeService', 'GameService', 'CarouselService'];

    function controller($scope, $window, $timeout,
                        config, styler, util, MenuService,
                        ThemeService, GameService, CarouselService )
    {
        var page = this;

        page.carouselAnimationEnd = carouselAnimationEnd;
        page.createAllSystemStyles = createAllSystemStyles;
        page.goFavorites = goFavorites;
        page.goSystemDetail = goSystemDetail;
        page.initSystembar = initSystembar;
        page.keyArrowDown - keyArrowDown;
        page.keyArrowLeft = keyArrowLeft;
        page.keyArrowRight = keyArrowRight;
        page.keyArrowUp = keyArrowUp;
        page.keyEnter = keyEnter;
        page.keyPress = keyPress;
        page.mouseDown = mouseDown;
        page.mouseMove = mouseMove;
        page.mouseOut = mouseOut;
        page.mouseUp = mouseUp;
        page.nextSystem = nextSystem;
        page.previousSystem = previousSystem;
        page.stopDragging = stopDragging;

        page.systembar = {};
        page.helpmenu = [
          {langButton: 'menu',
                click: MenuService.toggleMenu,
                  svg: 'resources/button_start.svg'
          },
          {langButton: 'select',
                click: keyEnter,
                  svg: 'resources/button_a.svg'
          },
          {langButton: '',
                click: goFavorites,
                  svg: 'resources/favorite-o.svg',
                color: '990000'
          } // red
        ];

        activate();

        function activate()
        {
            delete GameService.filtered;

            page.loaded = false;

            page.initSystembar(); // ???
            
            page.animating = false;  // just used for carousel animation -1, 0 or +1

            util.register_keyPressCallback(keyPress, $scope);

            // wait for config (need to know which theme?)
            config.init()
            .then(function(response)
            {
                // wait for themes to load
                return ThemeService.themeInit(null, 'system', config.app.ScanAtStartup == 'true');
            })
            .then(function(data)
            {
                CarouselService.createCarouselSystems(ThemeService.theme);

                var system_name = CarouselService.getCurrentCarouselSystemName();

                ThemeService.setSystem(system_name, 'system');
                ThemeService.playSound('bgsound');

                page.loaded = true;

                // get the current system gamelist
                // (to show games total and get list ahead of navigation)
                return GameService.getGamelist(system_name);
            })
            .then(function()
            {
                return util.waitForRender($scope)
            })
            .then(function()
            {
                // all done so get other stuff in advance

                // for next/prev carousel image animations
                createAllSystemStyles();

                $scope.app.registerThemeChangedCallback(createAllSystemStyles);

                if (config.app.LoadAllSystems)
                {
                    // get other systems game lists in the background
                    GameService.getGamelist('auto-allgames');
                }

            });
        }

        function carouselAnimationEnd($event)
        {
            $event.preventDefault();
            $event.stopPropagation();
            if (!page.animating) // already done?
            {
                return;
            }

            page.animating = false;
            GameService.getGamelist(CarouselService.getCurrentCarouselSystemName())
            .then(createAllSystemStyles);
        }

        // do some of probably next screen work to smooth animations transitions
        function createAllSystemStyles()
        {
            styler.createViewStyles(CarouselService.getRelativeCarouselSystemTheme(0).view.system, true, CarouselService.getRelativeCarouselSystemName(0));
            styler.createViewStyles(CarouselService.getRelativeCarouselSystemTheme(+1).view.system, true, CarouselService.getRelativeCarouselSystemName(+1));
            styler.createViewStyles(CarouselService.getRelativeCarouselSystemTheme(-1).view.system, true, CarouselService.getRelativeCarouselSystemName(-1));
            //styler.createViewStyles(CarouselService.getRelativeCarouselSystemTheme(+2).view.system, true);
            //styler.createViewStyles(CarouselService.getRelativeCarouselSystemTheme(-2).view.system, true);
            //angular.forEach(ThemeService.theme.systems, function(sys) {
            //    styler.createViewStyles(sys.view.system, true);
            //})

            //createDefaultGamelistView();
        }

        function createDefaultGamelistView()
        {
            var system_name = CarouselService.getCurrentCarouselSystemName();
            var default_view = GameService.getDefaultGamelistViewName(system_name);
            styler.createViewStyles(ThemeService.system.view[default_view], true, system_name);
        }

        function goFavorites()
        {
            GameService.show_favorite = true;
            setGoDetailAnimation();
            util.call('/auto-favorites');
        }


        function goSystemDetail(system_name)
        { 
            GameService.show_favorite = false;
            setGoDetailAnimation();
            util.call('/'+system_name); // E.g navigate to '/n64'         
        }

        function initSystembar(y)
        {
            page.systembar.x = 0;
            page.systembar.y = 0;
            page.systembar.change_ix = 0;
            if (styler.carousel)
            angular.forEach(styler.carousel.logos, function(cell, index) {
                delete cell.left;
                delete cell.top;
                delete cell.width;
                delete cell.height;
                delete cell.opacity;
                delete cell['font-size'];
            });
        }

        // roll systems Up
        function keyArrowDown()
        {
            if (styler.carousel.type && (styler.carousel.type == 'vertical' || styler.carousel.type == 'vertical_wheel'))
            {
                nextSystem();
            }
        }

        // roll systems left
        function keyArrowLeft()
        {
            if (!styler.carousel.type || styler.carousel.type != 'vertical')
            {
                previousSystem();
            }
        }

        // roll systems right
        function keyArrowRight()
        {
            if (!styler.carousel.type || styler.carousel.type != 'vertical')
            {
                nextSystem();
            }
        }

        // roll systems Down
        function keyArrowUp()
        {
            if (styler.carousel.type && (styler.carousel.type == 'vertical' || styler.carousel.type == 'vertical_wheel'))
            {
                previousSystem();
            }
        }

        // click whichever system is selected
        function keyEnter()
        {
            GameService.show_favorite = false;
            setGoDetailAnimation();
            CarouselService.goCurrentCarouselSystem();
        }

        function keyPress($event)
        {
            if($event.target.tagName == 'INPUT' || $event.target.tagName == 'TEXTAREA')
                return true;

            $event.stopPropagation();

            // Ctrl - M - Main Menu
            if (($event.ctrlKey || util.commandDown) && $event.keyCode == 77)
            {
                config.toggleMenu();
                return true;
            }

            if ($event.keyCode == 13) // enter
            {
                return keyEnter();
            }
            else if ($event.keyCode == 37) // left
            {
                return keyArrowLeft();
            }
            else if ($event.keyCode == 38) // up
            {
                return keyArrowUp();
            }
            else if ($event.keyCode == 39) // right
            {
                return keyArrowRight();
            }
            else if ($event.keyCode == 40) // down
            {
                return keyArrowDown();
            }
            // type a character - goto 'auto-allgames' page
            else if ( !$event.shiftKey &&
                      !$event.ctrlKey &&
                      !$event.altKey &&
                      ( ($event.keyCode >= 48 && $event.keyCode <= 57) ||  // 0-9
                        ($event.keyCode >= 65 && $event.keyCode <= 90)) )  // a-z
            {
                if (!GameService.filter)
                {
                    GameService.filter = String.fromCharCode(event.keyCode);
                    util.call('/auto-allgames');
                    return false;
                }
            }

            return true;
        }

        // remember the start dragging point offset
        // and which system clicked
        function mouseDown($event, system_name)
        {
            //$event.preventDefault();
            var pageX, pageY;
            if ($event.which==3)
            {
              return;
            }
            if ($event.touches)
            {
                if(!$event.touches.length)
                {
                    return;
                }
                pageX = $event.touches[0].pageX;
                pageY = $event.touches[0].pageY;
            }
            else
            {
                pageX = $event.pageX;
                pageY = $event.pageY;
            }
            if (!page.systembar.dragging)
            {
                page.systembar.clicked_pageX = pageX;
                page.systembar.clicked_pageY = pageY;
                page.systembar.clicked_offsetX = pageX - page.systembar.x;
                page.systembar.clicked_offsetY = pageY - page.systembar.y;
                page.systembar.clicked_system_name = system_name;
                page.systembar.dragging = true;
                page.systembar.dragged = false;
            }
        }

        // change systembar x by difference in mouse x
        function mouseMove($event)
        {
            $event.preventDefault();
            $event.stopPropagation();
            var pageX, pageY;
            if($event.touches)
            {
                if(!$event.touches.length)
                {
                    return;
                }
                pageX = $event.touches[0].pageX;
                pageY = $event.touches[0].pageY;
            }
            else
            {
                pageX = $event.pageX;
                pageY = $event.pageY;
            }

            var x_pct = 100 * pageX / $window.innerWidth;
            if ( x_pct >= 98 && x_pct <= 2)
            {
                return stopDragging();
            }
            var y_pct = 100 * pageY / $window.innerHeight;
            if ( y_pct >= 98 && y_pct <= 2)
            {
                return stopDragging();
            }
            if (page.systembar.dragging)
            {
                // vertical
                if (styler.carousel.type && styler.carousel.type == 'vertical')
                {
                  var new_y = pageY - page.systembar.clicked_offsetY;
                  if (page.systembar.y != new_y)
                  {
                      page.systembar.y = new_y;
                      var change_pct = new_y / $window.innerHeight;
                      styler.changeCarousel(change_pct);
                      page.systembar.change_ix = util.round(-change_pct / styler.carousel.logo_vh, 0);
                      page.systembar.dragged = true;
                  }
                }
                // vertical_wheel
                // TODO: work out the angle between new_x, new_y, old x y, rotation origin
                // into change_pct
                if (styler.carousel.type && styler.carousel.type == 'vertical_wheel')
                {
                    var new_y = pageY - page.systembar.clicked_offsetY;
                    if (page.systembar.y != new_y)
                    {
                        page.systembar.y = new_y;
                        var change_pct = new_y / $window.innerHeight;
                        styler.changeCarousel(change_pct);
                        page.systembar.change_ix = util.round(-change_pct / styler.carousel.logo_vh, 0);
                        page.systembar.dragged = true;
                    }
                }
                // horizontal
                else
                {
                  var new_x = pageX - page.systembar.clicked_offsetX;
                  if (page.systembar.x != new_x)
                  {
                      page.systembar.x = new_x;
                      var change_pct = new_x / $window.innerWidth;
                      styler.changeCarousel(change_pct);
                      page.systembar.change_ix = util.round(-change_pct / styler.carousel.logo_vw, 0);
                      page.systembar.dragged = true;
                  }
                }
            }
        }

        function mouseOut($event)
        {
            $event.preventDefault();
            $event.stopPropagation();

            var y_pct = 100 * $event.pageY / $window.innerHeight;
            var x_pct = 100 * $event.pageX / $window.innerWidth;
            if ( x_pct >= styler.carousel.pos.x &&
                 x_pct <= styler.carousel.pos.x + styler.carousel.size.w &&
                 y_pct >= styler.carousel.pos.y &&
                 y_pct <= styler.carousel.pos.y + styler.carousel.size.h)
            {
                return;
            }
            stopDragging();
        }

        // either a click or stop dragging
        function mouseUp($event)
        {
          $event.preventDefault();
          $event.stopPropagation();
            if (!page.systembar.dragged)
            {
                if (page.systembar.clicked_system_name !== undefined)
                {
                    goSystemDetail(page.systembar.clicked_system_name);
                }
            }
            else if (page.systembar.change_ix)
            {
              CarouselService.nextCarouselSystem(page.systembar.change_ix);
              GameService.show_favorite = false;
              GameService.getGamelist(CarouselService.getCurrentCarouselSystemName());
            }

            stopDragging();
        }

        function nextSystem()
        {
            if (config.app.WaitForAnimations && page.animating)
            {
                return;
            }
            page.animating = true;
            CarouselService.nextCarouselSystem();
        }

        function previousSystem()
        {
            if (config.app.WaitForAnimations && page.animating)
            {
                return;
            }
            page.animating = true;
            CarouselService.previousCarouselSystem();  
        }

        function setGoDetailAnimation()
        {
            page.loaded = false;

            if ( config.app.ViewTransitions=='Fade' )
            {
                $scope.app.setViewAnimation('fade');
            }
            else if ( config.app.ViewTransitions=='Slide' )
            {
                $scope.app.setViewAnimation('slideup');
            }

            delete ThemeService.system;
            delete ThemeService.view;
        }

        // reindex and recenter, clear everything
        function stopDragging($event)
        {
            initSystembar();
            util.waitForRender($scope).then(function() {
                page.systembar.dragging = false;
            });
        }
    }

})();
