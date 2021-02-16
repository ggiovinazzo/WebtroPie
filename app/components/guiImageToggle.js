/**
 * image-toggle.directive.js
 *
 * Show an svg icon coloured by a specific colour or the current Theme help text colour
 * used for gui checkboxes and helpmenu icon toggles
 * 
 * E.g. <icon svg="resources/heart.svg" color="FF0000"></icon>
        <image-toggle
                  ng-model="app.config.app.ShowGameCounts"
                  on-svg="checkbox_checked.svg"
                  off-svg="checkbox_unchecked.svg">
        </image-toggle>
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie')
        .directive('imageToggle', imageToggle);

    function imageToggle()
    {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            template: '<img class="icon click" '+
                           'ng-click="vm.click($event)" '+
                           'ng-src="{{vm.img_src}}">',
            controller: controller,
            controllerAs: 'vm',
            bindToController: {
                ngModel: '=',
                //ngChange: '=',
                onSvg:'@',
                offSvg:'@',
                onColor: '@',
                offColor: '@'
            }
        }
        return directive;
    }

    controller.$inject = ['$scope', '$attrs', 'config', 'util', 'styler'];

    function controller($scope, $attrs, config, util, styler)
    {
        var vm = this;
        vm.$inInit = onInit;
        vm.click = click;
        activate();

        function activate()
        {
            $scope.$watch('vm.ngModel', updateImage);
        }

        function onInit()
        {
            if ($attrs.onColor == 'help' || $attrs.offColor == 'help')
            {
                $scope.$watch(function() {return styler.helpTextColor}, updateImage);
            }
        }

        function click($event)
        {
            if ($attrs.noclick)
                return;

            $event.preventDefault();
            $event.stopPropagation();
            // toggle value
            vm.ngModel = !vm.ngModel;
            updateImage();

            // if it's a configuration setting then auto save config
            if ($attrs.ngModel.substring(0,14) == 'app.config.app')
            {
                config.save($attrs.ngModel.substring(15), vm.ngModel, 'bool', config.APP);
            }

            // if we have a changed expression eval on parent scope
            if ($attrs.clicked)
            {
                // below should propegate anyway, but doesn't
                $scope.$parent.$eval($attrs.ngModel+'='+vm.ngModel);
                $scope.$parent.$eval($attrs.clicked);
            }
        }

        // either toggle value (thus image) or theme color has changed
        function updateImage()
        {
            // which svg and color?
            var img   = vm.ngModel ? vm.onSvg : vm.offSvg;
            var color = vm.ngModel ? vm.onColor : vm.offColor;
            if (color)
            {
                if (color == 'help')
                {
                    color = styler.helpTextColor;
                }
                vm.img_src = "svr/color_img.php?file=" + img + "&color=" + color;
            }
            else
            {
                vm.img_src = "svr/" + img;
            }
        }
    }

})();
