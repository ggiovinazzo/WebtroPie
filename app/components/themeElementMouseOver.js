/**
 * themeElement.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeElementMouseOver', themeElementMouseOver);

    function themeElementMouseOver() {
        var directive = {
            restrict: 'A',
            replace: false,
            controller: controller
        }
        return directive;
    }

    controller.$inject = ['$scope','$element','config','ThemerService','ThemeService'];

    function controller($scope, $element, config, ThemerService, ThemeService)
    {
        this.$onInit = onInit;

        function onInit()
        {
            $element
            .bind('mouseover', function ($event)
            {
                if (config.app.ThemeEditor &&
                     !ThemerService.mouseDown &&
                     !ThemerService.pinned
                    )
                {
                    var obj;
                    if($scope.vm && $scope.vm.obj)
                    {
                        obj = $scope.vm.obj;
                    }
                    else if ($scope.vm.liststyle)
                    {
                        obj = ThemeService.gamelist;
                        //console.log($scope);
                    }
                    if (obj != ThemerService.dontpin &&
                        obj != ThemerService.element)
                    {
                        $event.stopPropagation();
                        $event.preventDefault();
                        ThemerService.setElement(obj);
                        delete ThemerService.dontpin;
                    }
                }
            });
        }
    }

})();
