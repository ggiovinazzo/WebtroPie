'use strict';

// Declare app level module which depends on views, and components
var app = angular
    .module('WebtroPie', [
        'ngRoute',
        'ngAnimate',
        'WebtroPie.util',
        'WebtroPie.config_service',
        'WebtroPie.theme_service',
        'WebtroPie.styler_service',
        'WebtroPie.components',
        'WebtroPie.system_view',
        'WebtroPie.game_service',
        'WebtroPie.gamelist_view',
        'WebtroPie.gamelist',
        'WebtroPie.game_editor',
        'WebtroPie.carousel_service',
        'WebtroPie.es_service',
        'WebtroPie.menu_service',
        'WebtroPie.themer_service',
        'ngTouch',
        'animEnd'
    ])
    .config([ '$routeProvider', '$compileProvider', appConfig ]);

app.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
});

function appConfig( $routeProvider, $compileProvider )
{
    $compileProvider.debugInfoEnabled(false);

    $routeProvider
    .when('/',  // this page is the main view
    {
        templateUrl: 'views/system.view.html',
        controller: 'SystemViewController',
        controllerAs: 'page'
    })
    .when('/:system/:subdir*?',
    {
        templateUrl: 'views/gamelist.view.html',
        controller: 'GamelistViewController',
        controllerAs: 'page'
    })
    .otherwise(
    {
        redirectTo: '/'
    });
}

