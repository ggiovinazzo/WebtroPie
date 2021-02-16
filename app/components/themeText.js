/**
 * themeText.js
 *
 * Show text for labels and metadata whos style is described by theme object
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeText', themeText);

    function themeText()
    {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            template: '<div id="{{vm.obj.name}}" ng-show="vm.obj.style" ng-style="vm.obj.style" '+
                             ' class="{{vm.obj.multiline?\'text_multiline\':\'text\'}}">'+
                          '<div ng-style="vm.obj.inner"'+
                             ' class="text_{{vm.obj.multiline?\'multiline_\':\'\'}}inner">{{vm.text}}</div>'+
                          '<theme-text ng-if="vm.text_obj" obj="vm.text_obj"></theme-text>'+
                          '<theme-date ng-if="vm.date_obj" obj="vm.date_obj" text="vm.date_text"></theme-date>'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { obj:'=', game:'=', system:'=' }
        }
        return directive;

    }

    controller.$inject = ['$scope','$element','$timeout','$interval',
                            'util','GameService','ThemeService','styler'];

    function controller($scope, $element, $timeout, $interval,
                             util, GameService, ThemeService, styler)
    {
        var vm = this;

        vm.$onInit = onInit;

        function onInit()
        {
            if (vm.obj && vm.obj.name.substring(0,3)=='md_')
            {
                $scope.$watch('vm.game', gameChanged);
            }
            else if (vm.obj && vm.obj.name == 'logoText')
            {
                if (ThemeService.view.name == 'system' ||
                    !ThemeService.view.image.logo ||
                    !ThemeService.view.image.logo.img_src)
                {
                    vm.text = vm.system;
                }
            }
            $scope.$watch('vm.obj', themeChanged);
            autoScrollCheck();
        }

        function afterRender()
        {
            // set padding to found scrollbar width so as to hide it with overflow hidden
            vm.inner_div = $element[0].querySelector('.text_multiline_inner');

            if(vm.inner_div)
            {
                vm.obj.style['padding-right'] = (1+vm.inner_div.offsetWidth - vm.inner_div.clientWidth) + "px";
                vm.inner_height = vm.inner_div.offsetHeight;
                autoScrollStart();
            }
        }

        function autoScrollCheck()
        {
            if (vm.obj && vm.obj.multiline)
            {
                util.waitForRender($scope)
                    .then(afterRender);
            }
        }

        function autoScrollStart()
        {
            autoScrollStop();
            vm.scroll_y = vm.inner_div.scrollTop = 0;
            $timeout(autoScrollStartScrolling, 3000);
        }

        function autoScrollStartScrolling()
        {
            if (!vm.interval)
            vm.interval = $interval(autoScroll, 30);
        }

        function autoScrollStop()
        {
            if (vm.interval)
            {
                $interval.cancel(vm.interval);
                vm.interval = 0;
            }
        }

        function autoScroll()
        {
            if (vm.interval && vm.inner_div)
            {
                vm.inner_div.scrollTop = vm.scroll_y+=0.5;

                if (vm.scroll_y >= vm.inner_height)
                {
                  autoScrollStart();
                }
            }
        }

        function gameChanged(game)
        {
            vm.text = GameService.getGameMetadata(game, vm.obj);
            vm.text = styler.variableReplace(vm.text, vm.system);
            if (vm.date_obj)
            {
                vm.date_text = GameService.getGameMetadata(game, vm.date_obj);
            }
            autoScrollCheck();
        }

        function themeChanged()
        {
            if (vm.obj && vm.obj.name && vm.obj.name.substring(0,7)=="md_lbl_")
            {
                vm.md = vm.obj.name.substring(7);
                if (vm.md != 'rating')
                {
                    var obj;
                    delete vm.text_obj;
                    delete vm.date_obj;
                    if (ThemeService.view && ThemeService.view.datetime)
                    {
                        obj = ThemeService.view.datetime['md_'+vm.md];
                        if (obj && obj.style && obj.anchor_label)  // no position
                        {
                            vm.date_obj = obj;
                        }
                    }
                    if (!obj && ThemeService.view)
                    {
                        obj = ThemeService.view.text['md_'+vm.md];
                        if (obj && obj.style && obj.anchor_label)  // no position
                        {
                            vm.text_obj = obj;
                        }
                    }
                }
            }
            autoScrollCheck();
        }
    }

})();

