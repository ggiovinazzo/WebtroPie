/**
 * helpMenu.js
 *
 * Horizontal menu with dropdown/dropup submenus generated from menu array
 * 
 * inputs
 *     list : contains menu configuration, array of menu options
 *     obj : Theme configuration object for the helpmenu (position, font, etc.)
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('helpMenu', helpMenu);

    function helpMenu()
    {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            transclude: true,
            template: '<div class="helpsystembar" ng-style="vm.obj.style">'+
                          '<span ng-repeat="item in vm.list" class="dropdown"'+
                                  ' ng-click="item.click()"'+
                                  ' ng-mouseover="hover=true"'+
                                  ' ng-mouseout="hover=false"'+
                                  ' ng-show="vm.show(item)">'+
                              '<div class="filters" help-inverter>'+
                                  '<icon svg="item.svg" color="item.color||obj.iconcolor.hex"></icon>'+
                                  "{{item.langButton?' '+app.config.lang.button[item.langButton]:''}}"+
                              '</div>'+
                              '<div ng-class="app.styler.helpMenuOptionClasses"'+
                                    ' ng-style="app.styler.helpTextColorBorder"'+
                                    ' ng-show="hover && item.menu"'+
                                    ' ng-click="hover=false">'+
                                 '<a ng-repeat="option in item.menu" help-inverter'+
                                    ' ng-click="option.click()" >{{app.config.lang[vm.view][option.text]}}</a>'+
                              '</div>'+
                          '</span>'+
                          '<ng-transclude></ng-transclude>'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { list: '=', obj: '=', view: '@' },
        };
        return directive;
    }

    controller.$inject = ['$scope'];

    function controller($scope)
    {
        var vm = this;
        vm.show = show;

        // show when either there is no show expression
        // or when show expression is true
        function show(item)
        {
            if (!item)
            {
                return false;
            }
            else if (!item.show) // no show expression
            {
                return true;
            }
            $scope.$eval('result=' + item.show);
            return $scope.result;
        }
    }

})();
