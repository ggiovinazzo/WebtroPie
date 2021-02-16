/**
 * themeElementMover.js
 *
 * Resize, Drag and manage Element properties
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.components')
        .directive('themeElementMover', themeElementMover);

    function themeElementMover() {
        var directive = {
            restrict: 'E',
            replace: true,
            template: '<div>'+
                        '<div class="element-mover"'+
                          ' ng-show="vm.element"'+
                          ' ng-style="vm.moverStyle">'+
                          '<span'+
                               ' ng-if="(vm.element.size.h > 0.04 || vm.element.maxSize.h > 0.04)"'+
                               '">{{vm.element.name}}</span>'+
                          '<span class="close"'+
                               ' ng-show="vm.pinned && (vm.element.size.h > 0.04 || vm.element.maxSize.h > 0.04)"'+
                               ' ng-click="vm.close($event)">&times;</span>'+
                        '</div>'+
                        '<div ng-include="\'components/themeElementProperties.html\'"></div>'+
                      '</div>',
            controller: controller,
            controllerAs: 'vm'
        }
        return directive;
    }

    controller.$inject = ['$scope','$element','$document','$window',
                          'config','util','styler','ThemerService','ThemeService'];

    function controller($scope, $element, $document, $window,
                           config, util, styler, ThemerService, ThemeService)
    {
        var vm = this;
        //vm.change = change;
        vm.changeAlignment = changeAlignment;
        vm.changeFontSize = changeFontSize;
        vm.changeMaxSize = changeMaxSize;
        vm.changeOrigin = changeOrigin;
        vm.changePathColorTile = changePathColorTile;
        vm.changePos = changePos;
        vm.changeRotation = changeRotation;
        vm.changeSize = changeSize;
        vm.changeZIndex = changeZIndex;
        vm.close = close;
        vm.setElement = setElement;
        vm.tagChange = tagChange;

        var startX, startY, startW, startH;
        var initialMouseX, initialMouseY;
        var size, hasWidth, hasHeight;
        var moveX, moveY, resizeNorth, resizeSouth, resizeWest, resizeEast;
        var $mover;

        //vm.$onDestroy = onDestroy;
        vm.$onInit = onInit;
        vm.tags = ['image','text','textlist','datetime','rating','video','carousel','helpsystem'];
        vm.moverStyle = {};  // style or the overlay/hover
        vm.themeStyle; // style of the theme element
/*
        function onDestroy()
        {
            $document.unbind('mousemove', mouseMove);
            $document.unbind('mouseup', mouseUp);
        }
*/
        function onInit()
        {
            ThemerService.moverScope = $scope;

            // watch for mouse over different element
            $scope.$watch(function() { return ThemerService.element; }, elementChanged);
            $scope.$watch(function() { return config.app.ThemeSet }, clearElement);

            // fond the first div - the element overlay
            var elems =$element.find('div')
            angular.forEach(elems,function(v,k) {
                if(angular.element(v).hasClass('element-mover'))
                {
                    $mover = angular.element(v);
                    return false;
                }
            });

            // watch mouse move events on the whole document
            $document
                .bind('mousemove', mouseMove);

            // watch mouse down events on the first div
            $mover
                .bind('mousedown', mouseDown);
        }

        // --------------------------------
        // Start of change functions
        //
        // reflect changes from key entry to the mover panel
        // and also to the theme element properties and it's style

        function changeAlignment()
        {
            if (vm.element.tag == 'text')
            {
                styler.styleAlignment(vm.element, vm.element.inner);
            }
            else
            {
                styler.styleAlignment(vm.element, vm.themeStyle);
            }
        }

        function changeFontSize()
        {
            if (vm.element.tag == 'text')
            {
                styler.styleFontSize(vm.element, vm.element.inner);
            }
            else
            {
                styler.styleFontSize(vm.element, vm.themeStyle);
            }
        }

        function changeMaxSize()
        {
            if (vm.element.tag=='video')
            {
                styler.styleVideoMaxSize(vm.element, vm.themeStyle);
            }
            else if (vm.element.tag == 'textlist')
            {
                styler.styleSize(vm.element, vm.themeStyle);
                ThemeService.applyGamelistFieldsShown();
            }
            else
            {
                styler.styleImageMaxSize(vm.element, vm.themeStyle);
            }
            styler.calcObjBounds(vm.element);
            styler.styleImageMaxSize(vm.element, vm.moverStyle);
            //vm.moverStyle.width = hasWidth = vm.moverStyle.width || vm.moverStyle['max-width'];
            //vm.moverStyle.height = hasHeight = vm.moverStyle.height || vm.moverStyle['max-height'];
            vm.moverStyle.width = hasWidth = vm.moverStyle['max-width'] || vm.moverStyle.width;
            vm.moverStyle.height = hasHeight = vm.moverStyle['max-height'] || vm.moverStyle.height;
            setBorder();
        }


        function changeOrigin()
        {
            styler.styleOrigin(vm.element, vm.themeStyle);
            styler.calcObjBounds(vm.element);
            setOrigin();
        }

        function changePathColorTile()
        {
            styler.styleImagePathColorTile(vm.element, vm.themeStyle);
        }

        function changePos()
        {
            styler.stylePos(vm.element, vm.themeStyle);
            styler.calcObjBounds(vm.element);
            if (vm.element.tag == 'textlist')
            {
                ThemeService.applyGamelistFieldsShown();
            }
            setPos();
        }

        function changeRotation()
        {
            styler.styleRotation(vm.element, vm.themeStyle);
            setRotation();
        }

        function changeSize()
        {
            if (vm.element.tag == 'rating')
            {
                styler.styleRatingSize(vm.element, vm.themeStyle);
            }
            else if (vm.element.tag == 'textlist')
            {
                styler.styleSize(vm.element, vm.themeStyle);
                ThemeService.applyGamelistFieldsShown();
            }
            else
            {
                styler.styleSize(vm.element, vm.themeStyle);
            }

            styler.calcObjBounds(vm.element);
            setSize();
        }

        function changeZIndex()
        {
            if (vm.element.tag=='image')
            {
                styler.styleImageZIndex(vm.element, vm.themeStyle);
            }
            else if (vm.element.tag=='text')
            {
                styler.styleTextZIndex(vm.element, vm.themeStyle);
            }
            else if (vm.element.tag=='rating')
            {
                styler.styleRatingZIndex(vm.element, vm.themeStyle);
            }
            else if (vm.element.tag=='video')
            {
                styler.styleVideoZIndex(vm.element, vm.themeStyle);
            }
            setZIndex();
        }

        // -- End of change functions

        function clearElement()
        {
            ThemerService.setElement();
        }

        function close($event)
        {
            $event.stopPropagation();
            $event.preventDefault();
            vm.pinned = ThemerService.pinned = false;
            ThemerService.dontpin = ThemerService.element;
            ThemerService.setElement(null);
        }


        function elementChanged(element)
        {
            vm.element = element;
            if(element)
            {
                vm.tag = element.tag;
                vm.themeStyle = element.style;
                // make overlay size and position the same as the theme element
                if (vm.themeStyle)
                {
                    setPos();
                    setSize();
                    setOrigin();
                    setRotation();
                    setZIndex();
                    setBorder();
                }
            }
        }

        function mouseDown($event)
        {
            // rememeber state when clicked
            if (ThemerService.mouseDown = $event.which == 1)
            {
                vm.pinned = ThemerService.pinned = true;
                startX = $mover.prop('offsetLeft');
                startY = $mover.prop('offsetTop');
                startW = $mover.prop('offsetWidth');
                startH = $mover.prop('offsetHeight');
                initialMouseX = $event.clientX;
                initialMouseY = $event.clientY;
                $document.bind('mouseup', mouseUp);
            }
            mouseMove($event);
            return false;
        }

        // Drag or resize of the mouse is down
        // otherwise just set the cursor style when mouse over
        // borders or element
        function mouseMove($event)
        {
            var dx = $event.clientX - initialMouseX;
            var dy = $event.clientY -  initialMouseY;
            var top, left, width, height;

            if ($event.which != 1)
            {
                ThemerService.mouseDown = false;
            }

            // mouse not down so just set cursor style and
            // flags to either resize or move
            if (!ThemerService.mouseDown)
            {
                // cursor near to edges ? (within 8 pixels or top/left, 12 of bottom/right)
                resizeNorth = $event.offsetY < 8;
                resizeSouth = $event.target.offsetHeight - $event.offsetY < 12;
                resizeWest  = $event.offsetX < 8;
                resizeEast  = $event.target.offsetWidth - $event.offsetX < 12;

                // also move position when resizing left and top edges
                moveX = resizeWest;
                moveY = resizeNorth;

                // when cursor is near both edges, dont resize both : just move
                if (resizeNorth && resizeSouth)
                {
                    resizeNorth = resizeSouth = false;
                }
                if (resizeWest && resizeEast)
                {
                    resizeWest = resizeEast = false;
                }

                // set the right cursor depending on resize
                if (resizeNorth && resizeWest && hasWidth && hasHeight)
                {
                    vm.moverStyle.cursor = 'nwse-resize';
                }
                else if (resizeSouth && resizeEast && hasWidth && hasHeight)
                {
                    vm.moverStyle.cursor = 'nwse-resize';
                }
                else if (resizeSouth && resizeWest && hasWidth && hasHeight)
                {
                    vm.moverStyle.cursor = 'nesw-resize';
                }
                else if (resizeNorth && resizeEast && hasWidth && hasHeight)
                {
                    vm.moverStyle.cursor = 'nesw-resize';
                }
                else if (resizeNorth && hasHeight)
                {
                    vm.moverStyle.cursor = 'ns-resize';
                }
                else if (resizeSouth && hasHeight)
                {
                    vm.moverStyle.cursor = 'ns-resize';
                }
                else if (resizeWest && hasWidth)
                {
                    vm.moverStyle.cursor = 'ew-resize';
                }
                else if (resizeEast && hasWidth)
                {
                    vm.moverStyle.cursor = 'ew-resize';
                }
                else
                {
                    vm.moverStyle.cursor = vm.pinned ? 'move' : 'pointer';
                    moveX = moveY = true;
                }
            }

            if (ThemerService.mouseDown)
            {
                if (vm.moverStyle.cursor == 'pointer')
                {
                    vm.moverStyle.cursor = 'move';
                }

                // Horizontal resize
                if (hasWidth && (resizeWest || resizeEast))
                {
                    // calc new width
                    width = util.round((startW +
                                        (resizeWest ? -1 : 1) *  // negative delta
                                        (vm.element.origin && vm.element.origin.x ? 2 : 1) * // resizing both sides
                                         dx) / $window.innerWidth, 4);
                    // don't invert resize
                    if (width > 0)
                    {
                        if (vm.element.size && vm.element.size.w)
                        {
                            vm.element.size.w = width;
                            if (vm.element.tag == 'rating')
                            {
                                delete vm.element.size.h;
                            }
                            changeSize();
                        }
                        else if (vm.element.maxSize && vm.element.maxSize.w)
                        {
                            vm.element.maxSize.w = width;
                            changeMaxSize();
                        }
                        /*
                        vm.moverStyle.width = util.pct(width, 'vw');
                        if (vm.themeStyle.width)
                        {
                            vm.themeStyle.width = vm.moverStyle.width;
                        }
                        else if (vm.themeStyle['max-width'])
                        {
                            vm.themeStyle['max-width'] = vm.moverStyle.width;
                        }
                        */
                    }
                }

                // Vertical resize
                if (hasHeight && (resizeNorth || resizeSouth))
                {
                    // calc new height
                    height = util.round((startH +
                                        (resizeNorth ? -1 : 1) *  // negative delta
                                        (vm.element.origin && vm.element.origin.y ? 2 : 1) * // resizing both sides
                                         dy) / $window.innerHeight, 4);
                    if (vm.element.origin && vm.element.origin.y)
                    {
                        /*
                        if (resizeNorth)
                        {
                            height = util.round((startH +
                                (-dy / (vm.element.origin && vm.element.origin.h ? vm.element.origin.h : 1))) / $window.innerHeight, 4);
                        }
                        else
                        {
                            height = util.round((startH +
                                (dy / (vm.element.origin && vm.element.origin.h ? (1 -vm.element.origin.h) : 1))) / $window.innerHeight, 4);
                        }
                        */
                    }
                    // don't invert resize
                    if (height > 0)
                    {
                        if (vm.element.size && vm.element.size.h)
                        {
                            vm.element.size.h = height;
                            changeSize();
                        }
                        else if (vm.element.maxSize && vm.element.maxSize.h)
                        {
                            vm.element.maxSize.h = height;
                            changeMaxSize();
                        }
/*
                        vm.moverStyle.height = util.pct(height, 'vh');
                        if (vm.themeStyle.height)
                        {
                            vm.themeStyle.height = vm.moverStyle.height;
                        }
                        else if(vm.themeStyle['max-height'])
                        {
                            vm.themeStyle['max-height'] = vm.moverStyle.height;
                        }
*/
                    }
                }

                // Horizontal move
                if (moveX)
                {
                    left = util.round((startX + dx) / $window.innerWidth, 4);
/*
                    vm.themeStyle.left =
                     vm.moverStyle.left = util.pct(left, 'vw');
*/
                    vm.element.pos.x = left;
                    changePos();
                }

                // Vertical move
                if (moveY)
                {
                    top = util.round((startY + dy) / $window.innerHeight, 4);
/*
                    vm.themeStyle.top =
                     vm.moverStyle.top = util.pct(top, 'vh');
*/
                    vm.element.pos.y = top;
                    changePos();
                }
            }
            $scope.$evalAsync();

            return false;
        }

        // stop dragging or resizing
        function mouseUp()
        {
            ThemerService.mouseDown = false;
            $document.unbind('mouseup', mouseUp);
        }

        // when there is no adjustable size show solid border
        // (make border same colour as outline)
        // also set size to the same as the underlying element
        // which depends on the size of its contents.
        function setBorder()
        {
            var raw_container;
            var raw_element;

            // If height or width is not set then get from
            // element size (produced from it's contents)
            if (!hasWidth || !hasHeight)
            {
                raw_container = util.getElement('#'+vm.element.name);
                if (raw_container)
                {
                    raw_element = raw_container.children(':first');
                    if (raw_element && raw_element.length)
                    {
                        var rect = raw_element[0].getBoundingClientRect();
                        if (!hasWidth && rect)
                        {
                            vm.moverStyle.width = rect.width + 'px';
                        }
                        if (!hasHeight && rect)
                        {
                            vm.moverStyle.height = rect.height + 'px';
                        }
                    }
                }
            }

            // style border right solid for missing width
            if (!hasWidth)
            {
                vm.moverStyle['border-right'] = '2px solid yellow';
            }
            else
            {
                delete vm.moverStyle['border-right'];
            }

            // style border bottom solid for missing height
            if (!hasHeight)
            {
                vm.moverStyle['border-bottom'] = '2px solid yellow';
            }
            else
            {
                delete vm.moverStyle['border-bottom'];
            }
        }

        // from key selection update the element to the service
        // which in turn fires elementChanged
        // automatically pin
        function setElement(element)
        {
            if(element)
            {
                ThemerService.setElement(element);
                vm.pinned = ThemerService.pinned = true;
            }
        }


        // copy origin style from theme element to mover
        function setOrigin()
        {
            vm.moverStyle['-webkit-transform'] =
             vm.moverStyle['-ms-transform'] =
              vm.moverStyle.transform =
                    vm.themeStyle.transform;
                    //vm.element.tag == 'text' ? vm.element.style.transform  : vm.themeStyle.transform;
        }

        // copy position style from theme element to mover
        function setPos()
        {
            vm.moverStyle.left = vm.themeStyle.left;
            vm.moverStyle.top = vm.themeStyle.top;
            vm.moverStyle.display = vm.themeStyle.display;
        }

        // copy rotation style from theme element to mover
        function setRotation()
        {
            vm.moverStyle['-ms-transform'] = vm.moverStyle['-webkit-transform'] = vm.moverStyle.transform = vm.themeStyle.transform;
        }

        // copy size style from theme element to mover
        // and set hasWidth, hasHeight flags
        // size overrides max size
        function setSize()
        {
            //styler.styleImageMaxSize(vm.element, vm.moverStyle);
            vm.moverStyle.width = hasWidth = vm.themeStyle.width || vm.themeStyle['max-width'];
            vm.moverStyle.height = hasHeight = vm.themeStyle.height || vm.themeStyle['max-height'];
            setBorder();
        }

        // copy zIndex style from theme element to mover
        function setZIndex()
        {
            if (vm.element.fullscreen)
            {
                vm.moverStyle['z-index'] = vm.themeStyle['z-index'];
            }
            else
            {
                vm.moverStyle['z-index'] = vm.themeStyle['z-index'] + 10;
            }
        }

        // when element type (tag) change from keyboard
        // select first of its type, E.g. when selected image default first image element
        function tagChange()
        {
            if (!vm.element || vm.element.tag != vm.element)
            {
                var first_el;
                if (ThemeService.view[vm.tag])
                {
                    first_el = ThemeService.view[vm.tag][Object.keys(ThemeService.view[vm.tag])[0]];
                }
                ThemerService.setElement(first_el);
            }
        }
    }

})();
