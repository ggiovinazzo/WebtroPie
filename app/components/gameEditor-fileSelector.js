/**
 * gameEditor-fileSelector.js
 *
 * copies selected files into ngModel
 * which in turn should fire ngChange
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.game_editor')
        .directive('file', fileSelector);

    function fileSelector()
    {
        var directive = {
            restrict: 'A',
            require: 'ngModel',
            //scope: true,
            controller: FileSelectorCtrl,
            //controllerAs: 'vm',
            //bindToController: { ngModel:'=' }
        }
        return directive;
    }

    FileSelectorCtrl.$inject = ['$element','ngModel'];

    function FileSelectorCtrl($element, ngModel)
    {
        var vm = this

        // member functions
        vm.$onInit = onInit;

        function onInit()
        {
            util.waitForRender().then(bindFileChangesToModelValue);
        }

        function bindFileChangesToModelValue()
        {
            $element.bind('change', function(e) {
                if ($element[0].value)
                {
                    //vm.ngModel.$setViewValue($element[0].files);
                    ngModel.$setViewValue($element[0].files);
                }
            });
        }
    }

})();
