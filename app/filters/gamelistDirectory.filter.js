/**
 * gamelist-directory.filter.js
 *
 * Parameters
 *      subdir - the directory to filter to games
 *
 * Also references :-
 *      GameService.show_nested
 *      GameService.show_favorite
 *      config.app.ShowEmptyDirectories (passed in)
 *
 * Filter games within a gamelist by a directory to show just the games contained
 * within that directory
 *
 * also, filter favorites if show favorite is set
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.gamelist')
        .filter('directory', directory);
        
        
    function directory(GameService)
    {
        return function(games, subdir, ShowEmptyDirectories, filter)
        {
            // everything, do nothing just return the input array
            if (typeof games === 'undefined' ||
                (GameService.show_nested && !GameService.show_favorite))
            {
                return games;
            }

            var result = [];
            angular.forEach(games, function(game)
            {
                // show nothing if empty directory
                if (game.isDir &&
                      //!app.config.app.ShowEmptyDirectories &&
                      !ShowEmptyDirectories &&
                      GameService.subdirs &&
                      GameService.subdirs[game.path].games == 0)
                {
                    return;
                }

                if (filter)
                {
                    var name = game.name;
                    if (!name)
                    {
                        name = game.shortpath;
                    }
                    if (game.new)
                    {
                        name = 'New: ' + game.name;
                    }
                    else if (game.missing)
                    {
                        name = 'Missing: ' + game.name;
                    }
                    else if (game.duplicate)
                    {
                        name = 'Duplicate: ' + game.name;
                    }
                    if (name.toLowerCase().indexOf(filter.toLowerCase()) < 0)
                        return;
                }

                // folder and favourite filter
                if ( ( (GameService.show_nested ||
                         GameService.system_name=='auto-allgames' ||
                         GameService.system_name=='auto-favorites' ||
                         GameService.system_name=='auto-lastplayed') && !game.isDir) ||
                      (!subdir && !game.subdir) ||                    // both root folder
                      (subdir == game.subdir) )                       // matching folder name
                {
                    if (!GameService.show_favorite ||                  // show all
                        (GameService.show_favorite && game.favorite)) // show only favorite
                    {
                        result.push(game);
                    }
                }
            });
            return result;
        }
    }

})();

