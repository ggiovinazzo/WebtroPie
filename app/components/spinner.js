/**
 * spinner.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie')
        .directive('spinner', spinner);

    function spinner()
    {
        var directive = {
            templateUrl: 'components/spinner.html',
            link: link
        }

        function link(scope, element, attrs)
        {
            scope.size = attrs.size;
        }

        return directive;
    }

})();
