/**
 * menu.directive.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie')
        .directive('menu', menu);

    function menu()
    {
        var directive = {
            template: '<div class="modal">'+
                          '<div id="menu" class="menu_in">'+
                             '<div ng-include="app.menu.template"></div>'+
                          '</div>'+
                      '</div>'
        }
        return directive;
    }

})();
