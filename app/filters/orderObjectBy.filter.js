/**
 * order-object-by.filter.js
 *
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie')
        .filter('orderObjectBy', orderObjectBy);

    function orderObjectBy()
    {
        return function(items, field, reverse)
        {
            var filtered = [];

            angular.forEach(items, function(item)
            {
                filtered.push(item);
            });

            filtered.sort(function (a, b)
            {
                if (typeof field == 'string')
                {
                    return (a[field] > b[field] ? 1 : -1);
                }
                else if (typeof field == 'array')
                {
                    for (var i=0; i<field.length; i++)
                    {
                        if (a[field[i]] == b[field[i]])
                        {
                            continue;
                        }
                        return (a[field[i]] > b[field[i]] ? 1 : -1);
                    }
                }
            });

            if(reverse)
            {
                filtered.reverse();
            }
            return filtered;
        }
    }

})();
