/**
 * themeDate.js
 *
 * Show a date in a style defined by theme object in either a date format passed in or the
 * default date format as defined by settings
 *
 * If the date value is blank then use the blank value passed in E.g. 'Never', empty otherwise
 *
 * output is a string vm.date
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeDate', themeDate);

    function themeDate() {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            template: '<div id="{{vm.obj.name}}" class="text"'+
                          ' ng-style="vm.obj.style" '+
                          ' ng-show="vm.obj.style || vm.blank">'+
                          '<div class="text_inner vcenter" ng-style="vm.obj.inner">{{vm.date}}</div>'+
                          //'<div class="text_inner" ng-style="vm.obj.inner">{{vm.date}}</div>'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { obj:'=', game:'=', blank: '@' }
        }
        return directive;
    }

    controller.$inject = ['$scope','util','GameService'];

    function controller($scope, util, GameService)
    {
        var vm = this;

        vm.$onInit = onInit;

        function onInit()
        {
            //$scope.$watch(function() {return GameService.game}, gameChanged);
            $scope.$watch('vm.game', gameChanged);
        }

        function gameChanged()
        {
            var text = GameService.getGameMetadata(vm.game, vm.obj);

            if (!text)
            {
                vm.date = '';
                if (vm.blank)
                {
                    vm.date = vm.blank;
                }
                else if (vm.obj.name == 'md_releasedate')
                {
                    vm.date = 'Unknown';
                }
                else if (vm.obj.name == 'md_lastplayed')
                {
                    vm.date = 'Never';
                }
            }
            else
            {
                vm.date = util.formatDate(text, vm.obj.format);
            }
        }
    }

})();
