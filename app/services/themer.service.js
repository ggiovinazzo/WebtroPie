/**
 * themer.service.js
 */
(function () {

    'use strict';

    angular
        .module('WebtroPie.themer_service', [])
        .service('ThemerService', service);

    function service()
    {
        var self = this;
        self.setElement = setElement;

        function setElement(obj)
        {
            self.element = obj;
            if (self.moverScope)
            {
                self.moverScope.$evalAsync();
            }
        }

    }

})();
