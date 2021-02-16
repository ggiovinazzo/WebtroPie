/**
 * draggable.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('draggable', draggable);

    function draggable() {
        var directive = {
            restrict: 'A',
            controller: controller
        }
        return directive;
    }

    controller.$inject = ['$element','$document'];

    function controller($element, $document)
    {
        //var vm = this;
        var startX, startY, initialMouseX, initialMouseY;

        $element.css({
            cursor:  'move'
        });

        $element.bind('mousedown', function($event)
        {
            startX = $element.prop('offsetLeft');
            startY = $element.prop('offsetTop');
            initialMouseX = $event.clientX;
            initialMouseY = $event.clientY;
            $document.bind('mousemove', mousemove);
            $document.bind('mouseup', mouseup);
            return false;
        });

        function mousemove($event)
        {
            var dx = $event.clientX - initialMouseX;
            var dy = $event.clientY - initialMouseY;

            $element.css({
                top:  startY + dy + 'px',
                left: startX + dx + 'px'
            });
            return false;
        }

        function mouseup()
        {
            $document.unbind('mousemove', mousemove);
            $document.unbind('mouseup', mouseup);
        }
    }

})();
