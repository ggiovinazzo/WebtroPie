/**
 * carousel.service.js
 */
(function () {

    'use strict';

    angular
        .module('WebtroPie.carousel_service', [])
        .service('CarouselService', service);

    service.$inject = ['ThemeService','GameService', 'config', 'util', 'styler'];

    function service(ThemeService, GameService, config, util, styler)
    {
        var self = this;

        // Variables :-

        // index pointing to the system in self.systems array
        self.system_index = 0; // the first index in the array (alphabetically sorted)
        self.system = {};  // object of all systems where key is system name
        self.systems = [];  // array of all systems
        self.mid_index = 0; // floor(self.systems.length / 2)

        // public functions
        self.centerOffset = centerOffset;
        self.createCarouselSystems = createCarouselSystems;
        self.getCarouselSystemName = getCarouselSystemName;
        self.getCarouselSystemTheme = getCarouselSystemTheme;
        self.getCurrentCarouselSystemName = getCurrentCarouselSystemName;
        self.getRelativeCarouselSystemName = getRelativeCarouselSystemName;
        self.getRelativeCarouselSystemTheme = getRelativeCarouselSystemTheme;
        self.goCurrentCarouselSystem = goCurrentCarouselSystem;
        self.goNextCarouselSystemGamelist = goNextCarouselSystemGamelist;
        self.goPreviousCarouselSystemGamelist = goPreviousCarouselSystemGamelist;
        self.goSystemDetail = goSystemDetail;
        self.nextCarouselSystem = nextCarouselSystem;
        self.previousCarouselSystem = previousCarouselSystem;
        self.setCarouselSystemByIndex = setCarouselSystemByIndex;
        self.setCarouselSystemIndexByName = setCarouselSystemIndexByName;
        self.wrapIndex = wrapIndex;


        function centerOffset(index)
        {
            return wrapIndex(index + self.mid_index - self.system_index)-self.mid_index;
        }

        function createCarouselSystems(theme)
        {
            self.systems.length = 0;
            // create array of systems that we have (inc custom collections)
            // that the theme supports, then sort in carousel rules order (auto at end)
            angular.forEach(config.systems, function (system, system_name)
            {
                var car = self.system[system_name];
                // first time create
                if (car == undefined)
                {
                    car = {system_theme_name: system.theme,
                           system_name: system_name,
                                system: system};
                    self.system[system_name] = car;
                }

                if (system.has_system && (system.has_games || config.app.ShowEmptySystems))
                {
                    // Order carousel by system fullname
                    // then custom collections then auto collections
                    car.order = config.app.OrderSystemsByFullname ? system.fullname : system.name;
                    car.system_theme_name = system.theme;
                    if (system.name.substring(0, 7) == 'custom-')
                    {
                        car.order = 'zzz' + car.order;

                        var custom = system.name.substring(7);
                        // If theme has system matching collection name then use that
                        if (theme.systems[custom])
                        {
                            car.system_theme_name = custom;
                        }
                        else if (theme.systems['custom-collections'])
                        {
                            car.system_theme_name = 'custom-collections';
                        }
                    }
                    else if (system.name.substring(0, 5) == 'auto-')
                    {
                        car.order = 'zzzz' + car.order;
                    }
                    car.theme = theme.systems[car.system_theme_name] || theme.systems.default;

                    styler.setSystem(system_name);
                    if (car.theme.view.system.image &&
                        car.theme.view.system.image.logo)
                    {
                        styler.createImageStyle(car.theme.view.system.image.logo);
                    }
                    if (!car.theme.view.system.text)
                    {
                        car.theme.view.system.text = {};
                    }
                    if (!car.theme.view.system.text.logoText)
                    {
                        car.theme.view.system.text.logoText = theme.systems.default.view.system.text.logoText;
                    }
                    if (car.theme.view.system.text && car.theme.view.system.text.logoText)
                    {
                        styler.createLogoTextStyle(car.theme.view.system.text.logoText);
                    }
                    else
                    {
                        console.log(system_name, 'no logoText');
                    }

                    self.systems.push(car);
                }
            });
            styler.clearSystem();

            self.mid_index = Math.floor(self.systems.length / 2);

            // sort systems array by name
            self.systems.sort(function (a, b)
            {
                if (a.order > b.order) return 1;
                if (a.order < b.order) return -1;
                return 0;
            });
        }

        function getCarouselSystemName(system_index)
        {
            return self.systems[wrapIndex(system_index)].system_name;
        }

        function getCarouselSystemThemeName(system_index)
        {
            return self.systems[wrapIndex(system_index)].system_theme_name;
        }

        function getCarouselSystemTheme(system_index)
        {
            return self.systems[wrapIndex(system_index)].theme;
        }

        // return E.g previous or next system name
        function getRelativeCarouselSystemName(offset)
        {
            return getCarouselSystemName(self.system_index + offset)
        }

        function getCurrentCarouselSystemName()
        {
            return getRelativeCarouselSystemName(0);
        }

        // return E.g previous or next system theme
        function getRelativeCarouselSystemTheme(change_ix)
        {
            return ThemeService.getSystemTheme(getRelativeCarouselSystemName(parseInt(change_ix)));
        }

        function goCurrentCarouselSystem(replace)
        {
            goSystemDetail(self.system_index, replace)
        }

        function goNextCarouselSystemGamelist(replace)
        {
            self.system_index++;
            goCurrentCarouselSystem(replace)
        }

        function goPreviousCarouselSystemGamelist(replace)
        {
            self.system_index--;
            goCurrentCarouselSystem(replace)
        }

        // navigate to the rom lists view
        function goSystemDetail(system_index, replace)
        {
            ThemeService.playSound('systemselect');

            var system_name = getCarouselSystemName(system_index);

            if (replace)
            {
                util.go('/'+system_name);
            }
            else
            {
                util.call('/'+system_name);
            }
        }


        // roll systems right 1 by default (or any other non zero number)
        function nextCarouselSystem(change_ix, keep_style)
        {
            if (!change_ix)
            {
                change_ix = 1;
            }
            ThemeService.playSound('systemscroll');
            self.setCarouselSystemByIndex(self.system_index + change_ix, null, keep_style);
        }


        // roll systems left
        function previousCarouselSystem(change_ix, keep_style)
        {
            if (!change_ix)
            {
                change_ix = 1;
            }
            self.setCarouselSystemByIndex(self.system_index - change_ix, null, keep_style);
            ThemeService.playSound('systemscroll');
        }

        // change system by system index
        function setCarouselSystemByIndex(system_index, view_name, keep_style)
        {
            self.system_index = wrapIndex(system_index);
            ThemeService.setSystem(getCarouselSystemThemeName(system_index), view_name, keep_style);
        }

        function setCarouselSystemIndexByName(system_name)
        {
            self.system_index = self.systems.findIndex(function(car) {
                return car.system_name == system_name;
            });
            if (self.system_index<0)
            {
                self.system_index = 0;
            }
        }

        // ensure index is always between 0 and array.length
        function wrapIndex(index)
        {
            return (index + self.systems.length)
                % self.systems.length;
        }
    }

})();
