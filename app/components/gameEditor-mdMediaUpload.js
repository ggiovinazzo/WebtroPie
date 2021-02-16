/**
 * gameEditor-mdMediaUpload.js
 *
 * show and handle media upload
 * show thumbnail and preview + info
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.game_editor')
        .directive('mdMediaUpload', mdMediaUpload);

    function mdMediaUpload()
    {
        var directive = {
            restrict: 'EA',
            scope: true,
            templateUrl: 'components/gameEditor-mdEditorUpload.html',
            controller: controller,
            controllerAs: 'vm',
            bindToController: { md:'@', accept:'@', thumbnail: '@', game: '=' }
        }
        return directive;
    }

    controller.$inject = ['$scope','$element','$http','GameService','util','config'];

    function controller($scope, $element, $http, GameService, util, config)
    {
        var vm = this;
        vm.gameMediaUrl = gameMediaUrl;
        vm.mediaLoaded = mediaLoaded;
        vm.zoomIn = zoomIn;
        vm.zoomOut = zoomOut;
        vm.zoomStyle = zoomStyle;
        vm.width = 0;
        vm.height = 0;
        vm.zoomScales = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
        vm.zoom = 4;
        vm.scale = null;

        // member functions
        vm.$onInit = onInit;

        function onInit()
        {
            util.waitForRender($scope).then(bindDropToUpload);
        }

        function bindDropToUpload()
        {
            $element
            .parent()
            .on('dragover', function(e) {
                e.stopPropagation();
                e.preventDefault();
                vm.dragover = true;
                $scope.app.dragover = true;
                $scope.$evalAsync();
                this.style['outline']='2px dashed #444';
                this.style['outline-offset']='-1vmin';
                this.style['background-color']='white';
            })
            .on('dragleave', function(e) {
                e.stopPropagation();
                e.preventDefault();
                vm.dragover = false;
                $scope.app.dragover = false;
                $scope.$evalAsync();
                this.style['outline']='';
                this.style['outline-offset']='';
                this.style['background-color']='';
            })
            .on('drop', function(e) {
                e.stopPropagation();
                e.preventDefault();
                upload(e.dataTransfer.files);
                vm.dragover = false;
                $scope.app.dragover = false;
                $scope.$evalAsync();
                this.style['outline']='';
                this.style['outline-offset']='';
                this.style['background-color']='';
            });
        }

        function gameMediaUrl()
        {
            if (vm.game[vm.md+'_url'])
            {
                return 'svr/'+vm.game[vm.md+'_url'];
            }
        }

        function mediaLoaded($event, width, height, size, mtime)
        {
            if ($event.type=='load')
            {
                vm.width = width;
                vm.height = height;
                if(vm.md=='video')
                {
                    vm.duration = Math.floor(size,0) + ' ' + config.lang.time.seconds;
                }
                else
                {
                    vm.size = util.humanSize(size);
                }
                vm.modified = util.formatDate(mtime);
                vm.modified_ago = util.formatDate(mtime,'ago');
            }
        }

        function upload(files)
        {
            if (files.length)
            {
                var formData = new FormData();
                formData.append('upload', files[0]);
                formData.append('system', vm.game.sys);
                formData.append('game_path', vm.game.path);
                formData.append('media', vm.md);
                vm.progress = 0;
                vm.uploading = true;
                //formData.append('filename', files[0].name);
                $http({
                    url: 'svr/game_media_upload.php',
                    method: "POST",
                    data: formData,
                    headers: {'Content-Type': undefined},
                    uploadEventHandlers: { progress: uploading }
                })
                .then(uploaded);
            }
        }

        function uploading(e)
        {
            if (e.lengthComputable)
            {
                vm.progress = util.round(100 * e.loaded / e.total, 2)+'%';
                vm.progress_text = e.loaded == e.total ? 'Processing...' : vm.progress;
            }
        }

        function uploaded(response)
        {
            // file uploaded so update gamelist game metadata
            if (response.data.success)
            {
                // E.g. set game.video = "videos/filename"
                vm.game[vm.md] = response.data.media_path;
                vm.game[vm.md+'_url'] = response.data.media_url;
                // flag that the field has changed
                GameService.mdChanged(vm.md, false, vm.game);
                // trigger digest cycle now so there's no visual delay
                $scope.$parent.$evalAsync();
                // finished
                vm.uploading = false;
                vm.progress = 0;
            }
        }

        function zoomIn()
        {
            if (vm.zoom < vm.zoomScales.length-1)
            {
                vm.zoom++;
            }
            vm.scale = vm.zoomScales[vm.zoom];
        }

        function zoomOut()
        {
            if (vm.zoom > 0)
            {
                vm.zoom--;
            }
            vm.scale = vm.zoomScales[vm.zoom];
        }


        function zoomStyle(xborder, yborder)
        {
            if (!vm.scale && !xborder)
            {
                return;
            }
            var scale = vm.scale || 1;
            return {width: (vm.width * scale + (xborder || 0))+'px',
                   height: (vm.height * scale + (yborder || 0))+'px'};
        }


    }

})();
