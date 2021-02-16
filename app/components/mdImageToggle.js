/**
 * mdImageToggle.js
 *
 * used to toggle boolean game attributes in game editor
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('mdImageToggle', mdImageToggle);

    function mdImageToggle()
    {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            template: '<img class="icon click" title="{{vm.title}}"'+
                         ' ng-click="vm.click($event)"'+
                         ' ng-style="vm.style"'+
                         ' ng-src="{{vm.img_src}}">',
            controller: controller,
            controllerAs: 'vm',
            bindToController: {
                game: '=',
                md:'@',
                autosave:'@', 
                size: '=',
                sizeUnits: '@'
            }
        }
        return directive;
    }

    controller.$inject = ['$scope','GameService','util','config'];

    function controller($scope, GameService, util, config)
    {
        var vm = this;
        vm.$onInit = onInit;
        vm.click = click;
        vm.style = {};

        function onInit()
        {
            // default icons
            if (vm.md == "hidden")
            {
                vm.imgUrlOn="svr/color_img.php?file=resources/eye.svg&color=444488";
                vm.imgUrlOff="svr/color_img.php?file=resources/eye.svg&color=55555590";
            }
            else if (vm.md == "kidgame")
            {
                vm.imgUrlOn="svr/color_img.php?file=resources/child.svg&color=B58151";
                vm.imgUrlOff="svr/color_img.php?file=resources/child.svg&color=55555590";
            }
            else if (vm.md == "favorite")
            {
                vm.imgUrlOn="svr/color_img.php?file=resources/favorite.svg&color=DD3000";
                vm.imgUrlOff="svr/color_img.php?file=resources/favorite.svg&color=55555590";
            }

            $scope.$watch('vm.size', changeSize);
            $scope.$watch('vm.game.'+vm.md, updateImage);
        }
        
        function click($event)
        {
            $event.stopPropagation();

            if (config.edit)
            {
                // toggle value
                vm.game[vm.md] = !vm.game[vm.md];
                // set changed flag, save if autosave set
                GameService.mdChanged(vm.md, vm.autosave, vm.game);
                // update image to reflect changed value
                updateImage();
            }
        }

        function changeSize(size)
        {
            if (size)
            {
                vm.style['max-width'] = util.pct(size, vm.sizeUnits);
                vm.style['max-height'] = util.pct(size, vm.sizeUnits);
            }
        }

        function updateImage()
        {
            if (vm.game && vm.game[vm.md] )
            {
                if (config.edit)
                {
                    vm.title = 'Click to turn '+config.lang.md_label[vm.md]+' OFF';
                }
                vm.img_src = vm.imgUrlOn;
            }
            else
            {
                if (config.edit)
                {
                    vm.title = 'Click to turn '+config.lang.md_label[vm.md]+' ON';
                }
                vm.img_src = vm.imgUrlOff;
            }
        }
    }

})();

