/**
 * config.service.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.config_service', [])
        .service('config', config);

    config.$inject = ['$http','$q','$httpParamSerializer'];
      
    function config($http, $q, $httpParamSerializer)
    {
        var self = this;

        // Config sections
        self.APP    = 1;   // this app config
        self.ENV    = 2;   // environmental info
        self.LANG   = 4;   // current language
        self.ES     = 8;   // emulationstation settings
        self.THEMES = 16;  // theme tweaks
        self.SYSTEMS = 32;
        self.THEMES_LIST = 64;  // theme tweaks
        self.ALL    = 255;

        self.init = init;
        self.load = load;
        self.save = save;

        // get either from memory or server
        function init(get, lang, refresh)
        {
            if (!get) get = self.ALL; // default: get everything
            if (self.promise && !refresh)  // already got settings
            {
                return self.promise;
            }
            self.promise = load(get, lang, refresh);

            self.promise
            .then(initConfigFetched)

            return self.promise;
        }

        function initConfigFetched()
        {
            if (!self.systems['auto-allgames'])
            {
                self.systems['auto-allgames'] = {
                    name: 'auto-allgames',
                    fullname: 'All',
                    theme: 'auto-allgames',
                    has_system: true,
                    has_games: true
                }
            }
            if (!self.systems['auto-favorites'])
            {
                self.systems['auto-favorites'] = {
                    name: 'auto-favorites',
                    fullname: 'Favorites',
                    theme: 'auto-favorites',
                    has_system: true,
                    has_games: true
                }
            }
            if (!self.systems['auto-lastplayed'])
            {
                self.systems['auto-lastplayed'] = {
                    name: 'auto-lastplayed',
                    fullname: 'Recent',
                    theme: 'auto-lastplayed',
                    has_system: true,
                    has_games: true
                }
            }
            if (!self.systems['retropie'])
            {
                self.systems['retropie'] = {
                    name: 'retropie',
                    fullname: 'RetroPie',
                    theme: 'retropie',
                    has_system: true,
                    has_games: true
                }
            }

            if(self.es.CollectionSystemsCustom)
            self.es.CollectionSystemsCustom
            .split(',')
            .forEach(function(system) {
                self.systems['custom-'+system] = {
                    name: 'custom-'+system,
                    fullname: system,
                    theme: 'custom-collections',
                    has_system: true,
                    has_games: true
                }
            });

        }

        function load(bitmask, lang, refresh)
        {
            var deferred = $q.defer();

            // fetch from server
            $http.get('svr/config_ini.php', {cache: false, params: {get: bitmask, lang: lang}})
            .then(function onSuccess(response)
            {
                if (bitmask & self.APP)
                {
                    self.app = response.data.app;
                    self.app.ViewStyle = self.app.ViewStyle || undefined;
                    self.app.ViewTransitions = self.app.ViewTransitions || undefined;
                }
                if (bitmask & self.ENV)     self.env = response.data.env;
                if (bitmask & self.LANG)    self.lang = response.data.lang;
                if (bitmask & self.ES)      self.es = response.data.es;
                if (bitmask & self.THEMES)  self.themes = response.data.themes;
                if (bitmask & self.SYSTEMS) self.systems = response.data.systems;
                if (bitmask & self.THEMES_LIST) self.themes_list = response.data.themes_list;
                self.edit = self.edit || response.data.edit;
                self.local = self.local || response.data.local;

                delete self.systems.retropie;

                deferred.resolve(response);
            });

            return deferred.promise;
        }

        function save(setting, value, type, file)
        {
            $http({
                method  : 'POST',
                url     : 'svr/config_save.php',
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
                data    : $httpParamSerializer({
                            setting: setting,
                            value: value,
                            type: type,
                            file: file
                         })
            });
        }
    }

})();
