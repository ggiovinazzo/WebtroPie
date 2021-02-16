/**
 * themeText.js
 *
 * theme view images, positioned and styled by theme, some of which can also be toggled
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeImage', themeImage);

    function themeImage()
    {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            template: '<div id="{{vm.obj.name}}" '+
                               'title="{{vm.title}}" '+
                               'ng-click="vm.click($event)">'+
                          '<div ng-if="!vm.obj.img" ng-style="vm.obj.style"></div>'+
                          '<img ng-if="vm.obj.img && vm.obj.img_src" '+
                               'ng-src="{{vm.obj.img_src}}" '+
                               'ng-style="vm.obj.style" '+
                               'on-load-image="vm.mediaLoaded($event, width, height, size, mtime)">'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { obj:'=', game:'=', type:'@', system:'=' }
        }
        return directive;
    }

    controller.$inject = ['$scope','config','util','GameService','styler'];

    function controller($scope, config, util, GameService, styler)
    {
        var vm = this;

        vm.$onInit = onInit;
        vm.mediaLoaded = mediaLoaded;

        function onInit()
        {
            if (vm.obj &&
                vm.obj.name &&
                vm.obj.name.substring(0,3) == 'md_')
            {
                vm.md = vm.obj.name.substring(3);

                if (vm.md == 'image' || vm.md == 'marquee')     // game image, just a static image
                {
                    vm.updateImage = updateImage;
                }
                else     // kidgame, favorite, hidden - a toggle image
                {
                    // set up ON / OFF images
                    if (!vm.obj.img_url_on)
                    {
                        var img_url;
                        if (vm.obj.style)
                        {
                            img_url = vm.obj.style['background-image'];
                            vm.obj.style.cursor = 'pointer';
                        }
                        else if (vm.obj.img)
                        {
                            vm.obj.img.cursor = 'pointer';
                        }

                        if (img_url && img_url.match(/color=/))
                        {
                            var on_color;
                            var off_alpha;
                            vm.obj.img_url_on = img_url;
                            vm.obj.img_url_off = '';
                            off_alpha = '50';
                            if (vm.md == 'kidgame')
                            {
                                on_color = 'B58151'; // brown teddy
                            }
                            else if (vm.md =='favorite')
                            {
                                on_color = 'DD3000'; // red heart
                            }
                            else if (vm.md =='hidden')
                            {
                                on_color = '444488'; // red heart
                            }
                            if(on_color)
                            {
                                vm.obj.img_url_on =
                                    img_url.replace(/color=[0-9a-f]*/i,'color='+on_color);
                            }
                            if(off_alpha)
                            {
                              vm.obj.img_url_off =
                                    img_url.replace(/(color=[0-9a-f]{6})[0-9a-f]*/i,'$1'+off_alpha);
                            }
                        }
                    }

                    vm.updateImage = updateToggleImage;
                    vm.click = click;
                }

                // watch for theme or view change
                $scope.$watch('vm.obj', vm.updateImage);

                // watch for current game change, update image using meta data value
                $scope.$watch('vm.game', vm.updateImage);
            }
            else
            {
                // if it's the default theme replace system variable
                updateImageSystemVariable();

                // watch for theme or view change
                $scope.$watch('vm.obj', updateImageSystemVariable);
            }
        }

        function getImageUrl()
        {
            if (vm.obj.img)
            {
                return vm.obj.img_src;
            }
            else if(vm.obj.style)
            {
                return vm.obj.style['background-image'];
            }
            else
            {
                return vm.obj.img_src || vm.obj.fullpath;
            }
        }

        function clearImageUrl()
        {
            if (vm.obj.img)
            {
                delete vm.obj.img_src;
            }
            else if(vm.obj.style)
            {
                delete vm.obj.style['background-image'];
            }
        }

        // click to toggle ON or OFF
        function click($event)
        {
            $event.stopPropagation();
            if (config.edit)
            {
                vm.game[vm.md] = !vm.game[vm.md];
                GameService.mdChanged(vm.md, true, vm.game);
                updateToggleImage();
            }
        }

        function mediaLoaded($event, width, height, size, mtime)
        {
            if ($event.type=='error') // either error or load
            {
                if (vm.obj.fulldefault)
                {
                    setImageUrl(styler.variableReplace(vm.obj.fulldefault, vm.system));
                }
                else
                {
                    console.log('Theme '+vm.obj.name+' image: failed to load image '+ getImageUrl());
                    clearImageUrl();
                }
            }
        }

        function setImageUrl(url)
        {
            if (vm.obj.img)
            {
                vm.obj.img_src = url;
            }
            else if(vm.obj.style)
            {
                vm.obj.style['background-image'] = url;
            }
        }

        function updateImage(new_val, old_val)
        {
            if (vm.game && vm.md && vm.game[vm.md+'_url'])
            {
                if (vm.game[vm.md+'_width'] && vm.game[vm.md+'_height'])
                {
                    vm.title = vm.game[vm.md+'_width'] +' x ' + vm.game[vm.md+'_height'];
                }
                setImageUrl('svr/'+vm.game[vm.md+'_url']);
            }
            else
            {
                if (vm.game && !vm.game.image_url && vm.obj.fulldefault)
                {
                    setImageUrl(styler.variableReplace(vm.obj.fulldefault, vm.system));
                }
                else
                {
                    clearImageUrl();
                }
            }
        }

        function updateImageSystemVariable()
        {
            // replace system variables
            if (vm.system)
            {
                setImageUrl(styler.variableReplace(getImageUrl(), vm.system));
            }
        }

        function updateToggleImage()
        {
            if (vm.game && vm.game[vm.md])
            {
                if (config.edit)
                {
                    vm.title = 'Click to turn '+config.lang.md_label[vm.md]+' OFF';
                }
                setImageUrl(vm.obj.img_url_on);
            }
            else
            {
                if (config.edit)
                {
                    vm.title = 'Click to turn '+config.lang.md_label[vm.md]+' ON';
                }
                setImageUrl(vm.obj.img_url_off);
            }
        }
    }

})();

