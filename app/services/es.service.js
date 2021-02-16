/**
 * es.service.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.es_service', ['WebtroPie.config_service','WebtroPie.menu_service'])
        .service('ES', ES);

    ES.$inject = ['config','MenuService','$http','$timeout','$q'];

    function ES(config, MenuService, $http, $timeout, $q)
    {
        var self = this;

        self.init = init;
        self.start = start;
        self.stop = stop;
        self.status = status;
        self.updateESstatusMenuItem = updateESstatusMenuItem;

        // Dummy gamelist for RetroPie menu
        self.retropieMenu = {
            game_index: 0,
            buffer_index: 0,
            scrolltop: 0,
            name: 'retropie',
            path: '',
            has_image: false,
            has_video: false,
            has_marquee: false,
            fetched: true,
            total: 1,
            subdirs: {},
            gamelist: []
        },

        self.startupMenuItem = {func: start};
        self.shutdownMenuItem = {func: stop};

        function get(params)
        {
            return $http.get('svr/es_control.php', {cache: false, params: params});
        }

        function getStatusAfterDelay(params, delay)
        {
            var deferred = $q.defer();

            if (params.start)
            {
                MenuService.showMenu('menu/es_starting.html');
            }
            else if (params.stop)
            {
                MenuService.showMenu('menu/es_stopping.html');
            }

            if (delay)
            {
                get(params); // send: don't wait, ignore response
                // wait delay secs, check status, return es_pid
                $timeout(function() {
                    status().then(done);
                }, delay);
            }
            else
            {
                get(params).then(done);
            }

            function done(response)
            {
                config.env.es_pid = response.data.es_pid;
                updateESstatusMenuItem();
                deferred.resolve(response);
                MenuService.hideMenu();
            }

            return deferred.promise;
        }

        function init()
        {
            setLanguage();
            updateESstatusMenuItem();
        }

        function setLanguage()
        {
            self.startupMenuItem.name = config.lang.es.start;
            self.shutdownMenuItem.name = config.lang.es.stop;
        }

        function start()
        {
            return getStatusAfterDelay({start: true}, 6000)
        }

        function stop()
        {
            return getStatusAfterDelay({stop: true}); //, 3000);
        }

        function status()
        {
            return get({status: true});
        }

        // if ES is running set Startup / Shutdown menu
        function updateESstatusMenuItem()
        {
            if (config.local)
            {
                self.retropieMenu.gamelist[0]
                    = config.env.es_pid ? self.shutdownMenuItem : self.startupMenuItem;
            }
        }
    }

})();
