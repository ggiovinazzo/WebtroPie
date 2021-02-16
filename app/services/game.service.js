/**
 * game_service.js
 *
 * Service to handle Game and Gamelists
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.game_service', ['WebtroPie.config_service'])
        .service('GameService', service);

    service.$inject = ['config','util','ThemeService', 'ES', 'MenuService',
                         '$http', '$httpParamSerializer', '$q', '$timeout', '$location'];

    function service(config, util, ThemeService, ES, MenuService,
                          $http, $httpParamSerializer, $q, $timeout, $location)
    {
        var self = this;

        self.allgames = [];

        self.checkSystemTheme = checkSystemTheme;
        self.deleteGame = deleteGame;
        self.getDefaultGamelistViewName = getDefaultGamelistViewName;
        self.getGamelist = getGamelist;
        self.getGameMetadata = getGameMetadata;
        self.getParentDir = getParentDir;
        self.getSubDirectory = getSubDirectory;
        self.getSystemGamelist = getSystemGamelist;
        self.goSystem = goSystem;
        self.hideEditor = hideEditor;
        self.launch = launch;
        self.mdChanged = mdChanged;
        self.openFolder = openFolder;
        self.rememberGameMetadata = rememberGameMetadata;
        self.resetGame = resetGame;
        self.save = save;
        self.saveState = saveState;
        self.setLanguage = setLanguage;
        self.setSystem = setSystem;
        self.showEditor = showEditor;
        activate();

        function activate()
        {
            self.systems = {
                'retropie': ES.retropieMenu,
                'auto-allgames':
                    {  game_index: 0,
                       buffer_index: 0,
                       scrolltop: 0,
                       gamelist: self.allgames,
                       total: 0,
                       fetched: true },
                'auto-favorites':
                    {  game_index: 0,
                       buffer_index: 0,
                       scrolltop: 0,
                       gamelist: [],
                       total: 0,
                       fetched: true  },
                'auto-lastplayed':
                    {  game_index: 0,
                       buffer_index: 0,
                       scrolltop: 0,
                       gamelist: [],
                       total: 0,
                       fetched: true  }
            };

            self.gamelists_loaded = 0; // increases as system game lists are loaded

            /* map theme attribute (md) to gamelist field (tag),
                 and provides quick lookup of valid md fields */
            self.attrs = {
                 name:        "name",
                 description: "desc",
                 image:       "image",
                 rating:      "rating",
                 releasedate: "releasedate",
                 developer:   "developer",
                 publisher:   "publisher",
                 genre:       "genre",
                 players:     "players",
                 lastplayed:  "lastplayed",
                 playcount:   "playcount",
                 size:        "size",
                 human_size:  "human_size",
                 favorite:    "favorite",
                 kidgame:     "kidgame",
                 hidden:      "hidden",
                 marquee:     "marquee",
                 video:       "video",
                 modified:    "modified"
            }

            /* available columns for display in game list view, provides formatting
                 attributes as well as order by logic for each field */
            self.list_fields = [
                 {name: 'name',       type: 'text',                  orderby: 'name', show: true },
                 {name: 'favorite',   type: 'toggle',   width: 0.04, orderby: 'favorite', align: 'center'},
                 {name: 'kidgame',    type: 'toggle',   width: 0.04, orderby: 'kidgame', align: 'center'},
                 {name: 'hidden',     type: 'toggle',   width: 0.04, orderby: 'hidden', align: 'center'},
                 {name: 'human_size', type: 'text',     width: 0.08, orderby: ['-size', 'name'], align: 'right'},
                 {name: 'rating',     type: 'rating',   width: 0.08, orderby: ['!rating','-rating','name'] },
               //{name: 'rating',     type: 'text',     width: 0.06, orderby: ['!rating','-rating','name'] },
                 {name: 'releasedate',type: 'datetime', width: 0.07, orderby: ['-year','name'], format: 'yyyy', align: 'right' },
                 {name: 'releasedate',type: 'datetime', width: 0.13, orderby: ['!releasedate','releasedate'], align: 'right'},
                 {name: 'developer',  type: 'text',     width: 0.24, orderby: ['!developer','developer','name'] },
                 {name: 'publisher',  type: 'text',     width: 0.28, orderby: ['!publisher','publisher','name'] },
                 {name: 'genre',      type: 'text',     width: 0.16, orderby: ['!genre','genre','name'] },
                 {name: 'players',    type: 'text',     width: 0.03, orderby: ['players','name'], align: 'center' },
                 {name: 'lastplayed', type: 'datetime', width: 0.13, orderby: 'lastplayed', format: 'ago', reverse: true, align: 'right' },
                 {name: 'playcount',  type: 'text',     width: 0.04, orderby: 'playcount', reverse: true, align: 'center' },
                 {name: 'modified',   type: 'datetime', width: 0.13, orderby: 'mtime', format: 'ago', reverse: true, align: 'right'}
            ]

            config.init()
            .then(setLanguage);
        }

        function getDefaultGamelistViewName(system_name)
        {
            var system = ThemeService.getSystemTheme(system_name);

            if (config.app.ViewStyle && system.view[config.app.ViewStyle])  // user chosen view
            {
                return config.app.ViewStyle;
            }
            else if (self.systems[system_name])  // game list is loaded
            {
                if (self.systems[system_name].has_image)
                {
                    // theme has video view and either gamelist has a video or
                    // theme flag showSnapshotNoVideo is true
                    if (system.view &&
                        system.view.video
                         && (self.systems[system_name].has_video ||
                             system.view.video.showSnapshotNoVideo == 'true'))
                    {
                        return 'video';
                    }
                    else
                    {
                        return 'detailed';
                    }
                }
                else
                {
                    return 'basic';
                }
            }
            else
            {
                return 'detailed';
            }
        }

        function checkSystemTheme(system_name, chooseBestGamelistView)
        {
            var view_name;

            if (ThemeService.view.name == 'basic' ||
                  ThemeService.view.name == 'detailed' ||
                  ThemeService.view.name == 'video')
            {
                if (!chooseBestGamelistView &&
                     ThemeService.view &&
                     system_name == ThemeService.system.name)
                {
                    view_name = ThemeService.view.name;
                }
                else
                {
                    view_name = getDefaultGamelistViewName(system_name);
                }
            }
            else
            {
                view_name = ThemeService.view.name;
            }

            // make sure theme system/view matches the gamelist system
            if (!ThemeService.view ||
                  ThemeService.system.missing ||
                  system_name != ThemeService.system.name ||
                  view_name != ThemeService.view.name)
            {
                ThemeService.setSystemByName(system_name, view_name);
            }
        }

        // save changed fields for a single game
        function deleteGame(game, rom)
        {
            var post = { system: game.sys, game_path: game.path, rom: rom};

            post.delete = 1;
            if (!game.new)
            {
                post.index = game.index;
            }

            game.deleting = true;

            $http({
                method  : 'POST',
                url     : 'svr/game_save.php',
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
                data    : $httpParamSerializer(post)
            })
            .then(
                function onSuccess(response)
                {
                    if(response.data.success)
                    {
                        // also delete from client gamelists
                        [game.sys, 'auto-allgames', 'auto-favorites', 'auto-lastplayed']
                        .forEach(function(sys)
                        {
                            var gl = self.systems[sys].gamelist;
                            var i = gl.indexOf(game);
                            if (i>=0)
                            {
                                gl.splice(i, 1);
                                self.systems[sys].total--;
                            }
                        });
                        MenuService.hideMenu();
                        hideEditor();
                    }
                    game.deleting = false;
                },
                function onFailure(response)
                {
                    console.log('failed to delete');
                    console.log(response);
                    game.deleting = false;
                }
            );
        }

        function hideEditor()
        {
            self.edit = false;
        }

        // get either a specific gamelist for a system or all systems
        function getGamelist(system_name)
        {
            var promise;
            if (system_name.substring(0,4)=='auto' //||
                 //system.name.substring(0,6)=='custom'
                )      // get all systems
            {
                angular.forEach(config.systems, function(sys)
                {
                    if (!sys.has_system ||
                         sys.name.substring(0,4)=='auto' ||
                         sys.name.substring(0,6)=='custom' ||
                         sys.name.substring(0,6)=='retropie'
                     )
                    {
                        return;
                    }
                    var p = getSystemGamelist(sys.name);
                    if (!promise) promise = p;
                });
            }
            else     // specific system
            {
                promise =  getSystemGamelist(system_name);
            }

            return promise;
        }

        // return text, can either be extra text itself,
        // a game attribute label or a game attribute
        function getGameMetadata(game, obj, isMd)
        {
            var isObject = (typeof obj) == 'object';
            var name = isObject ? obj.name : obj;
            if (!name)
            {
                return '';
            }

            if (name && name.substring(0,7)=="md_lbl_")
            {
                return config.lang.md_label[name.substring(7)] + ":";
            }
            else if (name && name.substring(0,3)=="md_")
            {
                isMd = true;
                name = name.substring(3);
            }

            if (name && isMd && game)
            {
                var text = game[self.attrs[name]];
                //var text = game[self.attrs[name]];
                if (!text)
                {
                    if (name == 'genre')
                        return 'Unknown';
                    else if (name == 'players')
                        return '1';
                    else if (name == 'playcount')
                        return '0';
                    else if(name == 'name')
                        text = game.shortpath;
                    else
                        return;
                }

                if (isObject && obj.type == 'datetime')
                {
                    return util.formatDate(text, obj.format);
                }

                if (name == 'name')
                {
                    if (!game.isDir && self.system_name.substring(0,4)=='auto')
                    {
                        // remove [.*]
                        if(text)
                            text = text.replace(/\[[^\]]*\]/g,'')
                        // remove (.*)
                        if(text)
                            text = text.replace(/\([^\)]*\)/g,'');
                    }
                    if (game.new)
                    {
                        text = 'New: '+text;
                    }
                    else if (game.missing)
                    {
                        text = 'Missing: ' + text;
                    }
                    else if (game.duplicate)
                    {
                        text = 'Duplicate: ' + text;
                    }
                    if (game.isDir)
                    {
                        text += ' ('+self.subdirs[game.path].games+')';
                    }
                    else
                    {
                        if (self.system_name.substring(0,4)=='auto')
                        {
                            text += ' ['+game.sys+']';
                        }
                    }
                }

                return text;
            }

            return (typeof obj) == 'object' ? obj.text : obj;
        }

        // return path of parent directory
        function getParentDir(path)
        {
            if(!path)
            {
                return;
            }
            var i = path.lastIndexOf('/');
            if(i>0)
            {
                return path.substring(0,i);
            }
            return;
        }

        // if a path contains a directory ensure that the directories are
        // in the game list
        function getSubDirectory(system, path)
        {
            var i = path.lastIndexOf('/');
            if (i>0)
            {
                path = path.substring(0, i);  // strip off filename

                if (!system.subdirs[path])
                {
                    // new dir
                    var dir = {path: path,
                         game_index: 0,
                       buffer_index: 0,
                          scrolltop: 0,
                              games: 0};

                    var parent = getSubDirectory(system, path); // recursively find parents
                    if (parent)
                    {
                        dir.parent = parent;
                    }

                    system.subdirs[path] = dir;
                }
                return path;
            }
        }


        // get a single gamelist for a system
        function getSystemGamelist(system_name, scan, match_media)
        {
            var deferred = $q.defer();

            // already loaded ?
            if (self.systems[system_name] && !scan)
            {
                // still getting from a differnt call, maybe from previous page
                if (self.systems[system_name].promise)
                {
                    return self.systems[system_name].promise;
                }
                deferred.resolve(self.systems[system_name]);
            }
            else
            {
                var system = self.systems[system_name]; // already loaded?
                var rescan;

                if (!system)
                {
                    rescan = false;

                    // create a system object
                    var system = {game_index: 0,
                                buffer_index: 0,
                                   scrolltop: 0,
                                        name: system_name,
                                     subdirs: {}};

                    self.systems[system_name] = system;
                }
                else
                {
                    rescan = true;
                }

                system.promise = deferred.promise;

                if (config.app.ScanAtStartup)
                {
                    scan = 1;
                }

                var params = {getlist: true, system: system_name};
                var cache = false;

                if (scan)
                {
                    params.scan = true;
                }
                if (match_media)
                {
                    params.match_media = true;
                }
                if (!scan && !match_media && config.systems[system_name])
                {
                    params.mtime = config.systems[system_name].gamelist_mtime;
                    cache = true;
                }

                $http.get('svr/game_list.php', {cache: cache, params: params})
                .then(function onSuccess(response) {

                    // from custom game list get gamelists
                    // for all games listed
                    // then replace path with game object
                    if (system_name.substring(0,7) == 'custom-')
                    {
                        system.gamelist = response.data.game || [];
                        // find which unique systems are in the list
                        var systems = {};
                        angular.forEach(system.gamelist, function(custom, i)
                        {
                            systems[custom.system] = true;
                        });

                        // get each system, then replace it's games
                        var system_promises = [];
                        angular.forEach(systems, function(value, sysname)
                        {
                            var promise = getSystemGamelist(sysname);
                            promise
                            .then(function() {
                                // compare the full system game list ...
                                angular.forEach(self.systems[sysname].gamelist, function(game, index)
                                {
                                    // ... with the custom list
                                    angular.forEach(system.gamelist, function(custom, i)
                                    {
                                        // found
                                        if (!custom.name && custom.path == game.shortpath)
                                        {
                                            // replace path with full game info
                                            system.gamelist[i] = game;
                                        }
                                    });
                                });
                            })
                            system_promises.push(promise);
                        });

                        // all game paths replaced with full game objects
                        $q.all(system_promises)
                        .then(function() {
                            if (response.data.game)
                            {
                                // do any of the custom games have media
                                angular.forEach(response.data.game, function(game, index)
                                {
                                    if (game.image)
                                    {
                                        system.has_image = true;
                                    }
                                    if (game.marquee)
                                    {
                                        system.has_marquee = true;
                                    }
                                    if (game.video)
                                    {
                                        system.has_video = true;
                                    }
                                });
                                // sort by game real name
                                response.data.game.sort(function (a, b)
                                {
                                    return (a.name > b.name ? 1 : -1);
                                });
                            }
                            // total
                            system.total = system.gamelist.length;

                            system.fetched = true;
                            deferred.resolve(system);
                            delete system.promise;
                        });

                        return deferred.promise;
                    }

                    if (!rescan)
                    {
                        system.gamelist = response.data.game || [];
                        system.total = 0; // start count for games (not directories)
                        system.path =  response.data.path;

                        // concat arrays without creating a new array
                        //self.systems['auto-allgames'].gamelist.push.apply(
                        //    self.systems['auto-allgames'].gamelist, system.gamelist);
                    }

                    system.has_image =  response.data.has_image;
                    system.has_video =  response.data.has_video;
                    system.has_marquee =  response.data.has_marquee;

                    angular.forEach(response.data.game, function(game)
                    {
                        // continue if already loaded and not new
                        if (rescan)
                        {
                            if (!game.new && !match_media)
                            {
                                return;
                            }
                            var old_game = util.searchArrayByObjectField(system.gamelist, 'path', game.path);

                            if (old_game)
                            {
                                if (match_media)
                                {
                                    // found new image
                                    if (game.image_found && !old_game.image)
                                    {
                                        old_game.image = game.image;
                                        mdChanged('image', false, old_game);
                                    }
                                    // found new marquee
                                    if (game.marquee_found && !old_game.marquee)
                                    {
                                        old_game.marquee = game.marquee;
                                        mdChanged('marquee', false, old_game);
                                    }
                                    // found new video
                                    if (game.video_found && !old_game.video)
                                    {
                                        old_game.video = game.video;
                                        mdChanged('video', false, old_game);
                                    }
                                }
                                return;
                            }
                        }

                        game.sys = system_name;

                        if (game.lptime)
                        {
                            game.lastplayed = util.timestampToDate(game.lptime);
                        }

                        if (game.size >= 0)
                        {
                            game.human_size = util.humanSize(game.size);
                        }

                        if (game.mtime)
                        {
                            game.modified = util.timestampToDate(game.mtime);
                        }

                        // extra year
                        if (game.releasedate &&
                            game.releasedate.substring(0,8)!= '00000000')
                        {
                            game.year = game.releasedate.substring(0,4);
                        }
                        else
                        {
                            game.releasedate = '';
                            game.year = '';
                        }

                        if (!game.playcount)
                        {
                            game.playcount = 0;
                        }
                        else
                        {
                            game.playcount = parseInt(game.playcount);
                        }

                        if (game.rating<0)
                        {
                            game.rating = 0;
                        }
                        else if (game.rating>1)
                        {
                            game.rating = 1;
                        }

                        if (game.index && !game.isDir && game.size < 0)
                        {
                            game.missing = true;
                        }

                        // Add to list and auto lists
                        if (rescan)
                        {
                            system.gamelist.push(game);
                            self.systems['auto-allgames'].gamelist.push(game);
                        }

                        if (!game.isDir)
                        {
                            system.total++;
                            config.systems[system_name].has_games = true;
                            self.systems['auto-allgames'].gamelist.push(game);
                            self.systems['auto-allgames'].total++;
                            if (game.image)
                            {
                                self.systems['auto-allgames'].has_image = true;
                            }
                            if (game.marquee)
                            {
                                self.systems['auto-allgames'].has_marquee = true;
                            }
                            if (game.video)
                            {
                                self.systems['auto-allgames'].has_video = true;
                            }

                            if (game.favorite)
                            {
                                self.systems['auto-favorites'].gamelist.push(game);
                                self.systems['auto-favorites'].total++;
                                if (game.image)
                                {
                                    self.systems['auto-favorites'].has_image = true;
                                }
                                if (game.marquee)
                                {
                                    self.systems['auto-favorites'].has_marquee = true;
                                }
                                if (game.video)
                                {
                                    self.systems['auto-favorites'].has_video = true;
                                }
                            }
                            if (game.playcount>1)
                            {
                                self.systems['auto-lastplayed'].gamelist.push(game);
                                self.systems['auto-lastplayed'].total++;
                                if (game.image)
                                {
                                    self.systems['auto-lastplayed'].has_image = true;
                                }
                                if (game.marquee)
                                {
                                    self.systems['auto-lastplayed'].has_marquee = true;
                                }
                                if (game.video)
                                {
                                    self.systems['auto-lastplayed'].has_video = true;
                                }
                            }
                        }

                        // Work out subdirectories
                        //  only relative or under roms directory

                        var path = game.path;

                        // strip home directory (?shouldn't be any)
                        var sysdir = config.systems[system_name].path;
                        if (path.substring(0,sysdir.length) == sysdir)
                        {
                            path = path.substring(0,sysdir.length);
                        }

                        // dont even try if its an abs path
                        if (path.substring(0,1) == "/")
                        {
                            return;
                        }

                        // no need to point to current directory - this breaks urls so strip
                        if (path.substring(0,2) == "./")
                        {
                            path = path.substring(2);
                        }

                        var subdir = getSubDirectory(system, path);
                        if (subdir)
                        {
                            game.subdir = subdir;
                            system.subdirs[subdir].games++;
                        }

                        if (!game.name)
                        {
                            if (subdir)
                            {
                                game.name = path.substring(subdir.length+1);
                            }
                            else
                            {
                                game.name = path;
                            }
                        }

                        if (game.isDir)
                        {
                            if (!system.subdirs[path])
                            {
                                system.subdirs[path] = {
                                        path: path,
                                        game_index: 0,
                                        buffer_index: 0,
                                        scrolltop: 0,
                                        games: 0
                                    };
                            }
                            system.subdirs[path].game = game;
                        }

                    });

                    // Add any directories that contained games (in the game.path)
                    // but not in the game list file as entries themselves
                    var dir_count = 0;
                    angular.forEach(system.subdirs, function(dir, name)
                    {
                        if (!dir.game)
                        {
                            // create a game object
                            dir.game = {name: name, path: dir.path, isDir: true, sys: system.name};
                            // add it to the game list
                            system.gamelist.push(dir.game);
                        }
                        dir_count++;
                    });

                    system.gamelist.sort(function (a, b)
                    {
                        return (a.shortpath > b.shortpath ? 1 : -1);
                    });

                    // look for sub directories
                    var last_game = {};
                    system.duplicates = 0;
                    if (config.app.LogSystemTotals)
                    {
                        console.groupCollapsed("%s (%d)", system_name, system.total);
                        console.log("games = %d", system.total);
                            console.groupCollapsed("duplicates");
                    }
                    angular.forEach(system.gamelist, function(game) {
                        if (game.shortpath == last_game.shortpath)
                        {
                            game.duplicate = true;
                            last_game.duplicate = true;
                            if (config.app.LogSystemTotals)
                            {
                                console.groupCollapsed(game.shortpath);
                                    console.log("Index = %s", last_game.index);
                                    console.log("Name = %s", last_game.name);
                                    console.log("Path = %s", last_game.path);
                                    console.log("Index = %s", game.index);
                                    console.log("Name = %s", game.name);
                                    console.log("Path = %s", game.path);
                                console.groupEnd();
                            }
                            system.duplicates++;
                        }
                        last_game = game;
                    });
                    if (config.app.LogSystemTotals)
                    {
                            console.groupEnd();
                        console.log("duplicates = %d", system.duplicates);
                        console.log("directories = %d", dir_count);
                        console.log("total = %d", system.gamelist.length);
                        console.groupEnd();
                    }

                    system.gamelist.sort(function (a, b)
                    {
                        return (a.name > b.name ? 1 : -1);
                    });
                    if(system.duplicates > 0 && config.app.LogSystemTotals)
                    {
                        console.log("Warning: %s gamelist.xml contains %d duplicate rom paths", system_name, system.duplicates);
                    }

                    self.gamelists_loaded++;

                    system.fetched = true;
                    deferred.resolve(system);
                    delete system.promise;

                });

            }

            return deferred.promise;
        }


        function goSystem(system_name)
        {
            ThemeService.playSound('systemselect');
            delete ThemeService.applyGamelistFieldsShown;

            var subdir;
            if(self.systems[system_name])
            {
                subdir = self.systems[system_name].subdir;
            }

            //delete GameService.gamelist;
            delete self.game;

            // browse to new directory location (view/page change)
            if(subdir)
            {
                util.go('/'+system_name+'/'+subdir);
            }
            else
            {
                util.go('/'+system_name);
            }

            // TODO: animation
        }


        // launch the passed in game or current game remotely
        function launch(game)
        {
            game = game || self.game;

            $http.get('svr/game_launch.php',{
                cache: false,
                params: {
                    game_path: game.path,
                    system: game.sys
                }
            });
        }

        // record which metadata has changed and optionally save
        function mdChanged(md, autosave, game, changeSelected, selectedList)
        {
            game = game || self.game;  // the current game

            // is it really different?
            if(game.reset[md]==game[md])
            {
                return;
            }

            if (!game.changes)
            {
                game.changes = {};
            }

            game.changes[md] = true;

            // if requested auto save changes
            if(autosave)
            {
                save(game);
            }

            // duplicate change to all selected games
            if (selectedList && selectedList.length && game.selected && changeSelected)
            {
                angular.forEach(selectedList, function(selectedGame)
                {
                    if (selectedGame != game)
                    {
                        rememberGameMetadata(selectedGame);
                        selectedGame[md] = game[md];
                        mdChanged(md, autosave, selectedGame, false);
                    }
                });
            }
        }

        // navigate to sub folder
        function openFolder()
        {
            saveState();
            util.call( '/'+ self.game.sys + '/' + self.game.path );
        }

        // save a copy of the current game meta data incase of editing
        function rememberGameMetadata(game)
        {
            if (!game.reset)
            {
                game.reset = {};
                angular.forEach(self.attrs, function(field)
                {
                    game.reset[field] = game[field];
                });
            }
        }

        // restore game meta data to its original values
        function resetGame(game)
        {
            if (!game.reset)
            {
                return;
            }

            angular.forEach(self.attrs, function(field)
            {
                game[field] = game.reset[field];
            });
            ['url','w','h','size','duration','modified','modofied_ago']
            .forEach(function(f) {
                game['image_'+f] = game.reset['image_'+f];
                game['marquee_'+f] = game.reset['marquee_'+f];
                game['video_'+f] = game.reset['video_'+f];
            });

            delete game.changes;
        }

        // save changed fields for a single game
        function save(game)
        {
            var post = { system: game.sys, game_path: game.path};

            // insert
            if (game.new)
            {
                post.insert = 1;
                // send all fields for new game
                angular.forEach(self.attrs, function(gamelist_field, theme_field)
                {
                    post[gamelist_field] = game[gamelist_field];
                });
            }
            // update
            else
            {
                post.update = 1;
                post.index = game.index;
                // otherwise send only updated fields
                angular.forEach(game.changes, function(val, field)
                {
                    post[field] = game[field];
                });

                if (game.reset)
                {
                    if (post.image && game.reset.image && post.image != game.reset.image)
                    {
                        post.delete_image = game.reset.image;
                    }
                    if (post.marquee && game.reset.marquee && post.marquee != game.reset.marquee)
                    {
                        post.delete_marquee = game.reset.marquee;
                    }
                }
            }

            game.saving = true;

            $http({
                method  : 'POST',
                url     : 'svr/game_save.php',
                headers : { 'Content-Type': 'application/x-www-form-urlencoded' },
                data    : $httpParamSerializer(post)
            })
            .then(function onSuccess(response) {
                if(response.data.success)
                {
                    if (game.new)
                    {
                        game.index = response.data.index;
                    }
                    delete game.changes;
                    delete game.new;
                    delete game.reset;
                    rememberGameMetadata(game);
                    MenuService.hideMenu();
                    hideEditor();
                }
                game.saving = false;
            },function onFailure(response) {
                console.log('failed to save');
                console.log(response);
                game.saving = false;
            });
        }

        // remember state
        // store the index positions for either root or subdirectory
        function saveState(vm)
        {
            if (!vm && self.gamelist_vm)
            {
                vm = self.gamelist_vm;
            }
            if (!vm)
            {
                return;
            }
            if (self.subdir && self.subdirs[self.subdir])
            {
                self.subdirs[self.subdir].game_index = vm.game_index;
                self.subdirs[self.subdir].buffer_index = vm.buffer_index;
                if (vm.scroller)
                {
                    self.subdirs[self.subdir].scrollTop = vm.scroller.scrollTop;
                }
            }
            else
            {
                self.systems[self.system_name].game_index = vm.game_index;
                self.systems[self.system_name].buffer_index = vm.buffer_index;
                if (vm.scroller)
                {
                    self.systems[self.system_name].scrollTop = vm.scroller.scrollTop;
                }
          }
        }

        // set current language column headings
        function setLanguage()
        {
            angular.forEach(self.list_fields, function(field, index)
            {
                field.text = config.lang.md_label[field.name];
                if (field.name == 'releasedate' && field.format == 'yyyy')
                {
                    field.text = config.lang.md_label['year'];
                }
                field.order = index;
            });
        }

        // switch gamelist system, update system/gamelist globals
        function setSystem(system_name, subdir, chooseBestGamelistView, vm)
        {
            checkSystemTheme(system_name, chooseBestGamelistView);

            // if switching systems remember the subdirectory we are leaving
            if (self.system_name &&
                 self.system_name != system_name)
            {
                self.systems[self.system_name].subdir = self.subdir;
            }

            // restore state for new system
            self.game         = null;
            self.system_name  = system_name;
            self.gamelist     = self.systems[system_name].gamelist;
            self.path         = self.systems[system_name].path;
            self.has_image    = self.systems[system_name].has_image;
            self.has_video    = self.systems[system_name].has_video;
            self.has_marquee  = self.systems[system_name].has_marquee;
            if (self.system_name != system_name)
            {
                self.subdir   = self.systems[system_name].subdir;
            }
            else
            {
                self.subdir   = subdir
            }
            self.subdirs      = self.systems[system_name].subdirs;
            self.has_subdirs  = !angular.equals({},self.subdirs);

            if (vm)
            {
                self.gamelist_vm = vm;
                vm.gamelist = self.gamelist;
                if (self.subdir)
                {
                    vm.game_index   = self.subdirs[self.subdir].game_index;
                    vm.buffer_index = self.subdirs[self.subdir].buffer_index;
                    $timeout(function(){
                        vm.scrollTo(self.subdirs[self.subdir].scrollTop);
                    });
                }
                else
                {
                    vm.game_index   = self.systems[system_name].game_index;
                    vm.buffer_index = self.systems[system_name].buffer_index;
                    $timeout(function(){
                        vm.scrollTo(self.systems[system_name].scrollTop);
                    });
                }
                vm.setGame();
            }
        }

        function showEditor()
        {
            //$scope.app.hideMenu();
            if (config.edit)
            {
                self.edit = self.game;
            }
        }
    }

})();
