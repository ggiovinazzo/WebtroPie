/**
 * onLoadVideo.js
 *
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('onLoadVideo', ['$parse',
        function ($parse) {
            return {
              restrict: 'A',
              link: function (scope, elem, attrs) {
                var fn = $parse(attrs.onLoadVideo);
                elem.bind('loadeddata', function (event) {
                  scope.$apply(function() {
                    var width = elem[0].videoWidth;
                    var height = elem[0].videoHeight;
                    var duration = elem[0].duration;
                    var mtime = parseInt(elem[0].src.replace(/^.*\?/,''));
                    fn(scope, { $event: event,
                                 width: width,
                                height: height,
                                  size: duration,
                                 mtime: mtime });
                  });
                });
              }
            };
        }]);
})();
