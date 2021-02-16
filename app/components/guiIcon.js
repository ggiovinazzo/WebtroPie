/**
 * icon.directive.js
 *
 * Show an svg icon coloured by a specific colour or the current Theme help text colour
 * 
 * E.g. <icon svg="resources/heart.svg" color="FF0000"></icon>
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie')
        .directive('icon', icon);

    function icon()
    {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            template: '<img class="icon" ng-src="{{vm.img_src}}">',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { svg: '=', color: '=' }
        }
        return directive;
    }

    controller.$inject = ['$scope','styler'];

    function controller($scope, styler)
    {
        var vm = this;
        vm.$onInit = onInit;

        function onInit()
        {
            $scope.$watch(function() {return styler.helpIconColor}, updateThemeColor);
        }

        function updateThemeColor()
        {
            var color = vm.color || styler.helpIconColor;
            if (!color)
            {
                return;
            }
            color = color.substring(0,6);
            vm.img_src = "svr/color_img.php?file=" + vm.svg + "&color=" + color;
        }
    }

})();
