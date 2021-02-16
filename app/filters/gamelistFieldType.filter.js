/**
 * gamelist-fieldtype.filter.js
 *
 * Parameters
 *      type - the column to filter
 *
 * Filter game metadate columns to a type, E.g text, toggle or rating
 * dates are treated as text
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.gamelist')
        .filter('fieldtype', fieldtype);
        
        
    function fieldtype(GameService)
    {
        return function(fields, type)
        {
            var result = [];
            angular.forEach(fields, function(field)
            {
                if ( field.type == type ||
                     (type == 'text' && field.type == 'datetime') )
                {
                    result.push(field);
                }
            });
            return result;
        }
    }

})();
