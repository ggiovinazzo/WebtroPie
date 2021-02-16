/**
 * logo.js
 *
 * Show an a system logo image using button element, used on system view carousel
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components',[])
        .directive('logo', logo);


    function logo()
    {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            template: '<button class="systemlogo click">'+
                          '<theme-text obj="vm.logoText" system="vm.system"'+
                             'ng-if="!vm.logo || !vm.logo.img_src" '+
                          '></theme-text>'+
                          '<theme-image class="systemlogo click" '+
                             'ng-if="vm.logo && vm.logo.img_src" '+
                             'obj="vm.logo" system="vm.system">'+
                          '</theme-image>'+
                      '</button>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { system: '=', logo: '=', logoText: '=' }
        }
        return directive;
    }

    //controller.$inject = [];

    function controller()
    {
        var vm = this;
    }

})();

