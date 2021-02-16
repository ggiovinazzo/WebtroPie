/**
 * util.service.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.util', ['WebtroPie.config_service'])
        .service('util', util);

    util.$inject = ['config','$timeout', '$location', '$window', '$route', '$q', '$http'];
        
    function util(config, $timeout, $location, $window, $route, $q, $http)
    {
        var self = this;

        self.history = [];

        self.back = back; // return to page
        self.call = call; // generate history : to return
        self.datepartsToString = datepartsToString;
        self.dateToDateParts = dateToDateParts;
        self.focus = focus;
        self.getElement = getElement;
        self.go = go;     // replace current page : no history
        self.formatDate = formatDate;
        self.hex2rgba = hex2rgba;
        self.humanSize = humanSize;
        self.keyPress = keyPress;
        self.keyRelease = keyRelease;
        self.invert = invert;
        self.isDark = isDark;
        self.isLight = isLight;
        self.isVeryDark = isVeryDark;
        self.nextButton = nextButton;
        self.pct = pct;
        self.prevButton = prevButton;
        self.register_keyPressCallback = register_keyPressCallback;
        self.rgbToHSL = rgbToHSL;
        self.round = round;
        self.searchArrayByObjectField = searchArrayByObjectField;
        self.timestampToDate = timestampToDate;
        self.timestampToString = timestampToString;
        self.waitForRender = waitForRender;

        // return to page
        function back(path)
        {
            // if going to previous history then 'history.back'
            if (self.history.length>0)
            {
                var last = self.history[self.history.length-1];
                self.history.length--;
                if (path == last)
                {
                    $window.history.back();
                    return;
                }
            }
            // otherwise go there
            go(path);
        }

        // generate history : to return
        function call(path)
        {
            self.history.push($location.path());
            $location.path(path);
        }

        function datepartsToString(dp)
        {
            return dp.yyyy + dp.mm + dp.dd + ' ' + dp.hh + dp.mi +dp.ss;
        }

        function dateToDateParts(d)
        {
            function twoDigits(i)
            {
                return i<10 ? '0'+i : '' + i;
            }
            return {
                yyyy: d.getFullYear(),
                mm: twoDigits(d.getMonth()+1),
                dd: twoDigits(d.getDate()),
                hh: twoDigits(d.getHours()),
                mi: twoDigits(d.getMinutes()),
                ss: twoDigits(d.getSeconds())
            }
        }

        function datetimeAgo(date)
        {
            function unitsAgo(n, unit)
            {
                return config.lang.time.pre_ago +
                       n + ' ' + config.lang.time[unit+(n==1?'':'s')] +
                       config.lang.time.post_ago;
            }

            function monthDiff(d1, d2)
            {
                var months;
                months = (d2.getFullYear() - d1.getFullYear()) * 12;
                months -= d1.getMonth() + 1;
                months += d2.getMonth();
                return months <= 0 ? 0 : months;
            }

            var now = new Date();

            var secs = Math.floor((now - date) / 1000);
            if (secs < 60)
                return unitsAgo(secs, 'second');

            var mins = Math.floor(secs / 60);
            if (mins < 60)
                return unitsAgo(mins, 'minute');

            var hours = Math.floor(mins / 60);
            if (hours < 24)
                return unitsAgo(hours, 'hour');

            var days = Math.floor(hours / 24);
            if (days < 14)
                return unitsAgo(days, 'day');

            var weeks = Math.floor(days / 7);
            var months = monthDiff(date, now);

            if (months<2)
                return unitsAgo(weeks, 'week');

            if (months<12)
                return unitsAgo(months, 'month');

            var years = Math.floor(months / 12);
            return unitsAgo(years, 'year');
        }

        function focus(selector)
        {
            $timeout(function()
            {
                var el = getElement(selector);
                if (el && el.length > 0)
                {
                    el[0].focus();
                }
            });
        }

        function formatDate(date, format)
        {
            if (!format)
            {
                format = config.app.DateFormat || 'dd/mm/yyyy';
            }

            // released date kept as string as it may be E.g. 00/00/1985
            if (typeof date == 'string')
                return format
                    .replace(/yyyy/i, date.substring(0,4))
                    .replace(/mm/i,   date.substring(4,6))
                    .replace(/dd/i,   date.substring(6,8))
                    .replace(/hh/i,   date.substring(9,11))
                    .replace(/mi/i,   date.substring(11,13))
                    .replace(/ss/i,   date.substring(13,15))
                    .replace(/00\//g,'')
                    .replace(/^\/+/g,'');

            if (typeof date == 'number')
            {
                date = timestampToDate(date);
            }

            if (format == 'ago')
            {
                return datetimeAgo(date);
            }


            var dp = dateToDateParts(date);
            return format
                    .replace(/yyyy/i, dp.yyyy)
                    .replace(/mm/i,   dp.mm)
                    .replace(/dd/i,   dp.dd)
                    .replace(/hh/i,   dp.hh)
                    .replace(/mi/i,   dp.mi)
                    .replace(/ss/i,   dp.ss);
        }

        function getElement(selector)
        {
            return angular.element(document.querySelector(selector));
        }

        // replace current page : no history
        function go(path)
        {
            // if trying to go to current page then reload
            if ($location.path() == path)
            {
                $route.reload();
            }
            else
            {
                $location.path(path).replace();
            }
        }

        // convert "#RRGGBBAA" hex to string "rgba(r,g,b,a)" (decimal x 3 + float)
        function hex2rgba(hex)
        {
            if (!hex)
            {
                return '';
            }

            if (hex.length < 8)
            {
                if (hex.substring(0,1)=='#')
                    return hex;
                else
                    return '#'+hex;
            }
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (!result)
            {
                console.log('invalid color '+hex)
                return;
            }
            return 'rgba('+parseInt(result[1], 16)+','+
                                parseInt(result[2], 16)+','+
                                parseInt(result[3], 16)+','+
                                self.round(parseInt(result[4], 16)/255,2)+')';
        }

        function humanSize(bytes)
        {
            var sz = 'BKMGTP';
            var factor = Math.floor(((''+bytes).length - 1) / 3);
            return round(bytes / Math.pow(1024, factor),2) + sz[factor];
        }

        // convert "#RRGGBBAA" hex to string "rgba(r,g,b,a)" (decimal x 3 + float)
        function invert(hex)
        {
            if (!hex)
            {
                return '';
            }

            if (hex.length >= 6 )
            {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(hex);
                return 'rgb('+(255-parseInt(result[1], 16))+','+
                                  (255-parseInt(result[2], 16))+','+
                                  (255-parseInt(result[3], 16))+')';
            }
            else
            {
                var result = /^#?([a-f\d])([a-f\d])([a-f\d])/i.exec(hex);
                return 'rgb('+(15-parseInt(result[1], 16))+','+
                                  (15-parseInt(result[2], 16))+','+
                                  (15-parseInt(result[3], 16))+')';
            }
        }

        function isDark(col)
        {
            return !isLight(col);
        }

        function isLight(col)
        {
            if (col[0] == '#') col = col.substring(1);
            if (col.length == 3)
            {
                //if (col.substring(0,1)<'8' &&
                     //col.substring(1,2)<'8' &&
                     //col.substring(2,3)<'8')
                    //return false;
                if (col.substring(0,1)>'6' ||
                     col.substring(1,2)>'5' ||
                     col.substring(2,3)>'a')
                    return true;
            }
            else if (col.length >= 6)
            {
                //if (col.substring(0,1)<'8' &&
                     //col.substring(2,3)<'8' &&
                     //col.substring(4,5)<'8')
                    //return false;
                if (col.substring(0,1)>'6' ||
                     col.substring(2,3)>'5' ||
                     col.substring(4,5)>'a')
                    return true;
            }
            return false;
        }

        function isVeryDark(col)
        {
            if (col[0] == '#') col = col.substring(1);
            if (col.length == 3)
            {
                if (col.substring(0,1)<'4' &&
                     col.substring(1,2)<'4' &&
                     col.substring(2,3)<'4')
                    return true;
            }
            else if (col.length >= 6)
            {
                if (col.substring(0,1)<'4' &&
                     col.substring(2,3)<'4' &&
                     col.substring(4,5)<'4')
                    return true;
            }
            return false;
        }

        function keyPress($event)
        {
            if ($event.keyCode == 91)
            {
                self.commandDown = true;  // left command
            }
            if ($event.keyCode == 93)
            {
                self.commandDown = true;  // right command
            }
            if (self.keyPressCallback)
            {
                if (!self.keyPressCallback($event))
                {
                    $event.preventDefault();
                }
            }

            self.keyPressScope.$evalAsync();
        }

        function keyRelease($event)
        {
            if ($event.keyCode == 91)
            {
                self.commandDown = false;  // left command
            }
            if ($event.keyCode == 93)
            {
                self.commandDown = false;  // right command
            }
        }

        function nextButton(el)
        {
            var node = el.nextSibling;
            while (node)
            {
                // button and not hidden
                if (node.tagName=='BUTTON' && (node.className !== 'ng-hide'))
                {
                    node.focus();
                    break;
                }
                node = node.nextSibling;
            }
        }

        // given float 'f' (range 0 to 1) return either '0' or '(f*100)%'
        function pct(f, pct)
        {
            return f == 0 ? 0 : self.round(f*100,4)+pct;
        }

        function prevButton(el)
        {
            var node = el.previousSibling;
            while (node)
            {
                // button and not hidden
                if (node.tagName=='BUTTON' && (node.className !== 'ng-hide'))
                {
                    node.focus();
                    break;
                }
                node = node.previousSibling;
            }
        }

        function register_keyPressCallback(callback, scope)
        {
            self.keyPressCallback = callback;
            self.keyPressScope = scope;
        }

        // round a number to 'decimals' decimal places
        function round(value, decimals)
        {
            return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
        }

        // convert '#RRGGBBAA' hex to object {h,s,l,a} decimal
        function rgbToHSL(rgb)
        {
            // strip the leading # if it's there
            rgb = rgb.replace(/^\s*#|\s*$/g, '');

            // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
            if (rgb.length == 3)
            {
                rgb = rgb.replace(/(.)/g, '$1$1');
            }

            var r = parseInt(rgb.substr(0, 2), 16) / 255,
                 g = parseInt(rgb.substr(2, 2), 16) / 255,
                 b = parseInt(rgb.substr(4, 2), 16) / 255,
                 a = parseInt(rgb.substr(6, 2), 16) / 255,
                 cMax = Math.max(r, g, b),
                 cMin = Math.min(r, g, b),
                 delta = cMax - cMin,
                 l = (cMax + cMin) / 2,
                 h = 0,
                 s = 0;
            if (delta == 0)
                h = 0;
            else if (cMax == r)
                h = 60 * (((g - b) / delta) % 6);
            else if (cMax == g)
                h = 60 * (((b - r) / delta) + 2);
            else
                h = 60 * (((r - g) / delta) + 4);

            if (delta == 0)
                s = 0;
            else
                s = (delta/(1-Math.abs(2*l - 1)))

            return {
                h: self.round(h,4),
                s: self.round(s,4),
                l: self.round(l,4),
                a: self.round(a,4)
            }
        }

        // search an array of objects for a matching field
        // then either return its index, delete it, return requested field or the whole object
        function searchArrayByObjectField(obj_array, key, val, ret)
        {
            if (!obj_array)
                return;
            for (var i=0; i<obj_array.length; i++)
            {
                if (obj_array[i][key] == val)
                {
                    if (ret == 'index')
                        return i;
                    else if (ret == 'del')
                        return obj_array.splice(i, 1);
                    else if (ret)
                        return obj_array[i][ret];
                    else
                        return obj_array[i];
                }
            }
            if(ret == 'index')
                return -1;
        }

        function timestampToDate(secs)
        {
            return new Date(secs * 1000);
        }

        function timestampToString(secs)
        {
            return datepartsToString(dateToDateParts(timestampToDate(secs)));
        }

        function waitForRender(scope)
        {
            var deferred = $q.defer();

            // do at least one digest cycle
            if(scope)
            {
                if (!scope.$$phase)
                {
                    scope.$apply();
                }
                else
                {
                    scope.$evalAsync();
                }
            }

            function waitLoop()
            {
                if ($http.pendingRequests.length > 0)
                {
                    $timeout(waitLoop);
                }
                else
                {
                    deferred.resolve();
                }
            }
            $timeout(waitLoop);
            return deferred.promise;
        }

    }

})();
