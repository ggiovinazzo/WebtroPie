/**
 * themeRating.js
 *
 * Show a rating in a style defined by theme object
 *
 * A div with an unfilled stars background image contains a div with a stars foreground image.
 * the inner div's width % is adjusted to show the number of stars ratio
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeRating', themeRating);

    function themeRating()
    {
        var directive = {
            restrict: 'E',
            scope: true,
            template: '<div class="rating_background" title="{{vm.stars.width}}"'+
                                 ' ng-style="vm.style"'+
                                 ' ng-click="vm.click($event)">'+
                          '<div class="rating_foreground" ng-style="vm.stars"></div>'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { game: '=', obj: '=', autosave: '@', size: '=', sizeUnits: '@' }
        };
        return directive;
    }

    controller.$inject = ['$scope','config','util','GameService'];

    function controller($scope, config, util, GameService)
    {
        var vm = this;

        vm.$onInit = onInit;
        vm.calcStars = calcStars;
        vm.click = click;
        vm.setDefaults = setDefaults;
        vm.ratingChange = ratingChange;
        vm.sizeChange = sizeChange;
        vm.themeChange = themeChange;

        function onInit()
        {
            if(!vm.obj)
            {
                vm.style = {};
                vm.stars = {};
                setDefaults();
                $scope.$watch('vm.size', sizeChange);
            }
            else // if theme changes swap styles
            {
                $scope.$watch('vm.obj', themeChange);
            }

            // if game changes update the stars width style to new rating
            $scope.$watch('vm.game.rating', ratingChange);
        }

        function calcStars()
        {
            if (!vm.stars)
            {
                return;
            }
            if (!vm.game ||
                !vm.game.rating ||
                vm.game.rating<=0)  // bounds checking
            {
                vm.stars.width = '0';
            }
            else if (vm.game.rating >=1)
            {
                vm.stars.width = '100%';
            }
            else
            {
                vm.stars.width = (100 * vm.game.rating)+'%';
            }
        }

        // calc rating on ratio of width to mouse click X
        function click($event)
        {
            $event.stopPropagation();
            if (config.edit)
            {
                var width;

                if ($event.srcElement.className == 'rating_background') // clicked background
                {
                    width = $event.srcElement.clientWidth;
                }
                else                                                    // clicked foreground
                {
                    width = $event.srcElement.parentElement.clientWidth;
                }

                var rating = util.round( $event.offsetX / width , 2 );
                if (!isNaN(rating))
                {
                    vm.game.rating = rating;
                    calcStars();
                    GameService.mdChanged('rating', vm.autosave, vm.game);
                }
            }
        }

        function setDefaults()
        {
            vm.style['background-image']
              = 'url("svr/resources/star_unfilled.svg")';

            vm.stars['background-image']
              = 'url("svr/color_img.php?file=resources/star_filled.svg&color=FFD400")';
        }

        function ratingChange(rating)
        {
            if (!vm.game)
            {
                return;
            }
            vm.game.rating_pct = Math.floor( rating * 100 );
            calcStars();
        }

        function sizeChange(size)
        {
            vm.style.width = util.pct(size, vm.sizeUnits);
            vm.style.height = util.pct(size/5, vm.sizeUnits);
        }

        function themeChange(obj)
        {
            if (obj.style)
            {
                vm.style = obj.style;
            }
            if (obj.stars)
            {
                vm.stars = obj.stars;
                if (!vm.stars['background-image'])
                    setDefaults();
            }
            calcStars();
        }
    }

})();
