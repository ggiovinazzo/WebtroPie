/**
 * gamelist.js
 *
 * Show a game list styled by current theme
 * Dynamically show only games visible at the current scroll position
 * (otherwise very large lists would be slow to render)
 * 
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.gamelist', ['ngTouch','WebtroPie.game_service'])
        .directive('gamelistVirtualRepeat', gamelistVirtualRepeat);

    function gamelistVirtualRepeat()
    {
        var directive = {
            restrict: 'E',
            replace: true,
            scope: true,
            templateUrl: "components/gamelist.html",
            controller: GameListCtrl,
            controllerAs: 'vm',
            bindToController: { system: '@', subdir: '@', pageVm: '=' }
        }
        return directive;
    }

    GameListCtrl.$inject = ['$scope','$element','$window',
                                    'util','config','GameService','ThemeService','styler'];

    function GameListCtrl($scope, $element, $window,
                                 util, config, GameService, ThemeService, styler)
    {
        var vm = this

        vm.$onInit = activate;

        // public functions
        vm.applyFieldsShown = applyFieldsShown;
        vm.checkGameStillVisible = checkGameStillVisible;
        vm.clearSelection = clearSelection;
        vm.clickGame = clickGame;
        vm.getGameRowStyle = getGameRowStyle;
        vm.keyListBottom = keyListBottom;
        vm.keyListTop = keyListTop;
        vm.keyNextGame = keyNextGame;
        vm.keyNextPage = keyNextPage;
        vm.keyPress = keyPress;
        vm.keyPrevGame = keyPrevGame;
        vm.keyPrevPage = keyPrevPage;
        vm.mouseDown = mouseDown;
        vm.mouseMove = mouseMove;
        vm.mouseOver = mouseOver;
        vm.mouseUp = mouseUp;
        vm.onScroll = onScroll;
        vm.resetFields = resetFields;
        vm.rightClick = rightClick;
        vm.scrollTo = scrollTo;
        vm.scrollToBottom = scrollToBottom;
        vm.scrollToGame = scrollToGame;
        vm.scrollToTop = scrollToTop;
        vm.selectAll = selectAll;
        vm.selectRange = selectRange;
        vm.setGame = setGame;
        vm.setGameByIndex = setGameByIndex;
        vm.setOrderBy = setOrderBy;
        vm.toggleField = toggleField;
        vm.toggleSelected = toggleSelected;
        vm.toggleStretch = toggleStretch;

        // member private  variables
        vm.liststyle = {};
        vm.selectedList = [];
        vm.header = 0; // becomes 1 when additional columns are added

        function activate()
        {
            vm.pageVm.toggleField = toggleField; // make accessible to page / helpbar
            vm.pageVm.resetFields = resetFields; // make accessible to page / helpbar
            vm.pageVm.toggleStretch = toggleStretch;
            vm.pageVm.selectedList = vm.selectedList;
            vm.pageVm.checkGameStillVisible = checkGameStillVisible;

            vm.fetching = true;

            setOrderBy(GameService.list_fields[0]);

            // get games (and count) for the current system
            GameService.getGamelist(vm.system, vm)
            .then(function(data)
            {
                vm.fetching = false;
                //vm.gamelist      = data.gamelist;
                //vm.buffer_index = data.buffer_index;
                //vm.game_index    = data.game_index;
                vm.pageVm.gamelist = data.gamelist;

                GameService.setSystem(vm.system, vm.subdir, true, vm);
            });

            //GameService.viewscope = vm;
            GameService.keyPress = keyPress;
            ThemeService.applyGamelistFieldsShown = applyFieldsShown;
            applyFieldsShown();

            util.waitForRender($scope)
            .then(activateAfterRender);
        }

        function activateAfterRender()
        {
            vm.scroller =
                GameService.scroller =
                    $element[0].querySelector('#scroller'+vm.system)

            vm.scroller.addEventListener('scroll', onScroll);
        }

        function applyFieldsShown()
        {
            var gl = ThemeService.gamelist;
            var stretch = config.themes && config.themes['stretch-'+config.app.ThemeSet];
            if (!gl) {
                return;
            }

            // column widths 

            // find total additional width of all extra fields
            var width = 0;
            var extra_width = 0;
            var spacing = 0.005;  // gap between columns
            var count = 0;
            var max_width = gl.size.w - (gl.horizontalMargin || 0);

            angular.forEach(GameService.list_fields, function(f)
            {
                if (f.show) 
                {
                    count++;

                    if (f.name == 'name')
                    {
                        f.width = max_width;
                        width += f.width;
                    }
                    else
                    {
                        width += f.width + spacing;
                    }
                }
            });
            vm.header = count>1 ? 1 : 0;

            // find the difference of sum of all fields widths > gamelist width
            if (width <= max_width)
            {
                extra_width = 0;  // all fields are within gamelist width
            }
            else
            {
                extra_width = width - max_width;  // we need to stretch
            }

            // as width increases scale down to smaller font so text isn't truncated
            var fontsize;
            var gl_width;
            var selectorBarHeight;
            var linesize = gl.fontSize * (gl.lineSpacing || 1.5);

            if (gl.selectorHeight && !gl.fullselectorImagePath)
            {
                selectorBarHeight = gl.selectorHeight;
            }
            else
            {
                selectorBarHeight = linesize;
            }

            if (stretch)
            {
                fontsize = gl.fontSize / ( 1 + extra_width);
                gl_width = width / (1 + extra_width);
                linesize = 0.95 * linesize / (1 + extra_width);
                selectorBarHeight = selectorBarHeight / (1 + extra_width);
            }
            else {
                fontsize = gl.fontSize * gl.size.w / ( max_width + extra_width);
                gl_width = width * gl.size.w / ( max_width + extra_width);
                linesize = 0.95 * linesize * gl.size.w / ( max_width + extra_width);
                selectorBarHeight = selectorBarHeight / (1 + extra_width);
            }
            delete gl.style['font-size'];

            gl.linesize = linesize;
            gl.fontsize_scaled = fontsize;
            gl.selectorBarHeight = selectorBarHeight;

            // more rows with smaller font ?
            gl.rows = gl.size.h / gl.linesize - vm.header;

            gl.width = util.pct(gl_width,'vw');

            vm.liststyle.top = util.pct(gl.pos.y + vm.header * gl.linesize,'vh');
            vm.liststyle['max-height'] =
               //vm.liststyle.height = util.pct(gl.height_adjusted,'vh');
               vm.liststyle.height = util.pct(gl.size.h,'vh');

            vm.liststyle['font-size']  = util.pct(fontsize,'vh');
            vm.liststyle['line-height']  = util.pct(fontsize,'vh');
            vm.liststyle['font-family']  = gl.fontFamily;

            // column heading style

            vm.headerstyle = angular.copy(vm.liststyle);
            vm.headerstyle.top              = util.pct(gl.pos.y,'vh');
            vm.headerstyle['min-height'] = util.pct(gl.linesize,'vh');
            vm.headerstyle.width = gl.width;
            delete vm.headerstyle['height'];
            delete vm.headerstyle['max-height'];
            delete vm.headerstyle['overflow'];
            vm.headerstyle.color = util.hex2rgba(gl.secondaryColor);
            vm.liststyle['overflow'] = 'auto';
            vm.liststyle['z-index'] = gl.style['z-index'];

            if (stretch)
            {
                // move everything to the right of x by width and scale everything (left and right)
                // but only page components vertically beside gamelist, not above or below
                styler.insertIntoView(ThemeService.view, gl.pos.x + gl.size.w, extra_width, gl.pos.y, gl.pos.y + gl.size.h);
            }
            vm.liststyle.left = gl.style.left;
            vm.headerstyle.left = gl.style.left;

            // work out x + widths proportional to overall width
            var x = 0;
            if (gl.horizontalMargin)
            {
                x = parseFloat(gl.horizontalMargin);
            }
            angular.forEach(GameService.list_fields, function(f)
            {
                if (!f.show)
                    return true;

                f.vw = (gl_width * f.width / width) - spacing;

                var vcenter = -50;
                if (styler.fonts[gl.fontFamily])
                {
                    vcenter = styler.fonts[gl.fontFamily].vcenter;
                }
                f.style = { left: util.pct(x,'vw'),
                            width: util.pct(f.vw,'vw'),
                            'max-width': util.pct(f.vw,'vw'),
                            top: '50%',
                            'text-transform':  gl.inner['text-transform'],
                            '-webkit-transform': 'translateY('+vcenter+'%)',
                            '-ms-transform': 'translateY('+vcenter+'%)',
                            'transform': 'translateY('+vcenter+'%)'};

                x += f.vw + spacing;

                if (ThemeService.view.name == 'basic' || f.name == 'name')
                {
                    f.style['text-align'] = gl.alignment;
                }
                else if (f.align)
                {
                    f.style['text-align'] = f.align;
                }

                f.headerstyle = angular.copy(f.style);

                //f.style.height = util.pct(fontsize,'vh');
                f.headerstyle['max-height'] = util.pct(fontsize * 1.35 * gl.linesize * 100,'vh');
            });
        }

        // after user types changes in filter box or sort order and after filter applied
        // check that the current game is still visible
        function checkGameStillVisible()
        {
            if (!vm.filtered)  // check there is a list
            {
                return;
            }

            if(vm.game)
            {
                // search for game
                // is the current game in the new filtered list ?
                var game_index = vm.filtered.indexOf(vm.game);
                if (game_index >= 0)     // in list
                {
                    vm.game_index = game_index;
                    scrollToGame();
                    return;
                }
            }
            scrollToTop();
        }


        // clear all 'selected' flags for all games in the selected list
        function clearSelection()
        {
            vm.last_selected_index = -1;

            angular.forEach(vm.selectedList, function(game)
            {
                delete game.selected;
            });

            vm.selectedList.length = 0;  // truncate list
        }


        function clickGame(game, $event, $index)
        {
            var clicked_index = vm.buffer_index + $index;

            // SHIFT-CTRL CLICK: clear / select all
            if ($event && $event.shiftKey && ($event.ctrlKey || util.commandDown))
            {
                if (vm.selectedList.length == 0)
                {
                    selectAll();
                }
                else
                {
                    clearSelection();
                }
            }
            // SHIFT CLICK: select range
            else if ($event && $event.shiftKey && vm.last_selected_index>=0)
            {
                selectRange(clicked_index, vm.last_selected_index);
            }
            // CONTROL CLICK: select / unselect one
            else if ($event && ($event.ctrlKey || $event.shiftKey || util.commandDown))
            {
                toggleSelected(game);
            }
            // CLICK
            else
            {
                if (clicked_index == vm.game_index)
                {
                    if (game.func)
                    {
                        game.func();
                    }
                    else if (game.isDir)
                    {
                        GameService.openFolder();
                    }
                    else
                    {
                        GameService.showEditor();
                    }
                }
                else
                {
                    setGameByIndex(clicked_index);
                }
            }
        }


        // get the game row style for a game within a list
        function getGameRowStyle(game, $index)
        {
            if (!ThemeService.gamelist)
                return;

            var gl = ThemeService.gamelist;
            var style = {  top: util.pct(gl.selectorOffsetY + ($index * gl.linesize), 'vh'),
                           height: util.pct(gl.selectorBarHeight,'vh') };

            // game rom file does not exists
            if (game && !game.size && !game.isDir)
            {
                style['text-decoration'] = 'line-through';
                }

            if (game && game.selected)
            {
                style['border'] = '1px solid rgba(50,50,50,0.3)';
            }
            else
            {
                delete style.border;
            }

            // the current game
            if ($index == vm.game_index )
            {
                // colour the current selected game bar
                style.color = util.hex2rgba(gl.selectedColor);
                
                if(game != vm.game)
                    setGame();
                if(ThemeService.gamelist.selector)
                {
                    ThemeService.gamelist.selector.top = util.pct($index * gl.linesize, 'vh');
                }
                else
                {
                    style['background-color'] = util.hex2rgba(gl.selectorColor);
                }
            }
            // Directory - theme secondary gamelist colour
            else if (game && game.isDir)
            {
                style.color = util.hex2rgba(gl.secondaryColor);
            }
            // selected game
            else if (game && game.selected)
            {
                style.color = 'rgba(230,220,160,0.9)';
                style['background-color'] = 'rgba(90,90,90,0.4)';
            }
            // new game from scan
            else if (game && game.new)
            {
                style.color = '#00f900';
                style['-webkit-text-stroke-width'] = '1px';
                style['-webkit-text-stroke-color'] = '#00c000';
                style['text-shadow'] = '2px 2px 3px black, '+  // blur shadow
                                       '-1px -1px 0 black, '+  // black border
                                       '1px -1px 0 black, '+
                                       '-1px 1px 0 black, '+
                                       '1px 1px 0 black';
            }
            else if (game && game.missing)
            {
                style.color = '#f90000';
                style['-webkit-text-stroke-width'] = '1px';
                style['-webkit-text-stroke-color'] = '#c00000';
                style['text-shadow'] = '2px 2px 3px black, '+  // blur shadow
                                       '-1px -1px 0 black, '+  // black border
                                       '1px -1px 0 black, '+
                                       '-1px 1px 0 black, '+
                                       '1px 1px 0 black';
            }
            else if (game && game.duplicate)
            {
                style.color = '#fbef2e';
                style['-webkit-text-stroke-width'] = '1px';
                style['-webkit-text-stroke-color'] = '#fbb02e';
                style['text-shadow'] = '2px 2px 3px black, '+  // blur shadow
                                       '-1px -1px 0 black, '+  // black border
                                       '1px -1px 0 black, '+
                                       '-1px 1px 0 black, '+
                                       '1px 1px 0 black';
            }
            // normal unselected non current game
            else
            {
                style.color = util.hex2rgba(gl.primaryColor);
                delete style['background-color'];
            }

            return style;
        }


        // go to end of list - end key
        function keyListBottom()
        {
            if (!vm.filtered)
            {
                return;
            }

            ThemeService.playSound('scrollSound');

            scrollToBottom();
        }

        // go to top of list - home key
        function keyListTop()
        {
            if (!vm.filtered)
            {
                return;
            }

            ThemeService.playSound('scrollSound');

            scrollToTop();
        }

        // Move down 'count' games
        function keyNextGame(count)
        {
            if (!vm.filtered)
            {
                return;
            }

            ThemeService.playSound('scrollSound');

            var was_bottom = vm.game_index == vm.filtered.length -1;

            // round up - page down to mostly visible last row
            vm.game_index += Math.floor(count + 0.4);

            if (vm.game_index >= vm.filtered.length)
            {

                // wrap around bottom to top
                if (was_bottom)
                {
                    return scrollToTop();
                }
                // don't jump past end
                else if (count > 1)
                {
                    return scrollToBottom();
                }
            }

            scrollToGame();
        }

        function keyNextPage()
        {
            keyNextGame( ThemeService.gamelist.rows-1 );
        }

        function keyPress($event)
        {
            // Ctrl - A - Select or Deselect All
            if (($event.ctrlKey || util.commandDown) && $event.keyCode == 65)
            {
                if (vm.selectedList.length == 0)
                {
                    selectAll();
                }
                else
                {
                    clearSelection();
                }
                return;
            }
            else if ($event.keyCode == 36)          // Home key: top of list
            {
                return keyListTop();
            }
            else if ($event.keyCode == 35)          // End key: bottom of list
            {
                return keyListBottom();
            }
            else if ($event.keyCode == 38)          // up arrow: previous game
            {
                return keyPrevGame(1);
            }
            else if ($event.keyCode == 40)    // down arrow: next game
            {
                return keyNextGame(1);
            }
            else if ($event.keyCode == 33)    // page up: previous game * view rows
            {
                return keyPrevPage();
            }
            else if ($event.keyCode == 34)    // page down: next game * view rows
            {
                return keyNextPage();
            }

            return true; // default handling (dont prevent default)
        }

        // Move down 'up' games
        function keyPrevGame(count)
        {
            if (!vm.filtered)
            {
                return;
            }

            ThemeService.playSound('scrollSound');

            var was_top = vm.game_index == 0;

            vm.game_index -= Math.floor(count + 0.4); // move up by count

            if (vm.game_index < 0)
            {

                if (was_top)
                {
                    return scrollToBottom();
                }
                else if (count > 1)
                {
                    return scrollToTop();
                }
            }

            scrollToGame();
        }

        function keyPrevPage()
        {
            keyPrevGame( ThemeService.gamelist.rows-1 );
        }


        // remember the start dragging point offset
        function mouseDown($event)
        {
            var pageX, pageY;
            if($event.touches)
            {
                if(!$event.touches.length)
                {
                    return;
                }
                pageX = $event.touches[0].pageX;
                pageY = $event.touches[0].pageY;
            }
            else
            {
                pageX = $event.pageX;
                pageY = $event.pageY;
            }

            //if (!vm.dragging)
            //{
                vm.clicked_pageX = pageX;
                vm.clicked_pageY = pageY;
                vm.dragging = true;
                vm.dragged = false;
            //}
        }

        // change systembar x by difference in mouse x
        function mouseMove($event)
        {
            var pageX, pageY;
            if($event.touches)
            {
                if(!$event.touches.length)
                {
                    return;
                }
                pageX = $event.touches[0].pageX;
                pageY = $event.touches[0].pageY;
            }
            else
            {
                pageX = $event.pageX;
                pageY = $event.pageY;
            }

            if (vm.dragging)
            {
                var change_pct = 100 * (pageX - vm.clicked_pageX) / $window.innerWidth;
                //if (change_pct!=0)
                //{
                    //vm.dragged = true;
                //}
                if (change_pct > 20)
                {
                        //TODO
                    prevSystem();
                }
                else if (change_pct < -20)
                {
                        //TODO
                    nextSystem();
                }
            }
        }

        function mouseOver(game, $event)
        {
            if (!game)    // right click
            {
                game = vm.gameover;
            }
            else          // mouse over
            {
                vm.gameover = game;
            }

            // set title and menu position
            if (vm.context)
            {
                vm.context.top = ($event.pageY - 20)+'px';
                vm.context.left = ($event.pageX + 15)+'px';

                if(game.selected)
                {
                    vm.context.title =
                        GameService.select_list.length + ' games selected';
                }
                else
                {
                    vm.context.title = game.name;
                }
            }
        }

        // either a click or stop dragging
        function mouseUp($event)
        {
            vm.dragging = false;
            vm.dragged = true;
        }

        function onScroll($event)
        {
            var linesize_px = ThemeService.gamelist.linesize * $window.innerHeight;
            var buffer_index = GameService.scroller.scrollTop / linesize_px;
            buffer_index = Math.floor((buffer_index - 20)/50) * 50;  // buffer row start
            if (buffer_index<0) buffer_index = 0;
            if (vm.buffer_index != buffer_index)
            {
                vm.buffer_index = buffer_index;  // buffer row start
                $scope.$evalAsync();
            }
        }


        function resetFields(field)
        {
            // only show name field / index 0
            angular.forEach(GameService.list_fields, function(f, index) {
                f.show = (index == 0);
            });
            // turn off header
            vm.header = 0;

            // resize gamelist
            applyFieldsShown();
            // reset scale of everything else
            ThemeService.resetView(ThemeService.view);
        }


        function rightClick($event)
        {
            $scope.$apply(function()
            {
                $event.preventDefault();
                vm.context = {};
                mouseOver(null, $event);
            });
        }


        function scrollTo(y)
        {
            if (vm.scroller)
                vm.scroller.scrollTop = y;
        }

        // show/scroll to current game by index
        // similar to element.scrollIntoView() but also positions row
        // and sets buffer, game
        function scrollToGame()
        {
            // calc game row height in pixels
            var linesize_px = ThemeService.gamelist.linesize * $window.innerHeight;
            // visible top index
            var scroll_index = null;

            if (vm.game_index == 0)
            {
                vm.scroller.scrollTop = vm.buffer_index = 0;
            }
            // wrap around from top to bottom
            else if (vm.game_index < 0)
            {
                // end of list
                vm.game_index = vm.filtered.length-1;

                // find visible top index from end of list
                scroll_index = vm.filtered.length - (ThemeService.gamelist.rows - vm.header);

                // list is smaller than screen rows
                if (scroll_index < 0)
                {
                    scroll_index = 0;
                }

                scrollTo(scroll_index * linesize_px);
            }
            // set visible top to new game index
            else if ( vm.game_index * linesize_px < vm.scroller.scrollTop )
            {
                scroll_index = vm.game_index;

                scrollTo(scroll_index * linesize_px);
            }
            else
            {
                // scroll  everything down

                var gamelist_h = ThemeService.gamelist.size.h * $window.innerHeight
                      - vm.header * linesize_px;

                // game index pos in pixels is past the bottom of visible game list
                if ( (vm.game_index + 0.9) * linesize_px > vm.scroller.scrollTop + gamelist_h )
                {
                    scroll_index = vm.game_index - ThemeService.gamelist.rows;

                    // relative to end of list so that whole line shows for current game
                    // at bottom of list
                    scrollTo((1 + vm.game_index) * linesize_px - gamelist_h);
                }
            }

            // we moved
            if (scroll_index != null)
            {
                // visible scroll position
                //scrollTo(scroll_index * linesize_px);

                // buffer row start
                vm.buffer_index = Math.floor((scroll_index - 20)/50) * 50;
                if (vm.buffer_index < 0)
                {
                    vm.buffer_index = 0;
                }
            }

            setGame();
        }

        function scrollToBottom()
        {
            vm.game_index = -1; // wrap around to end

            scrollToGame();
        }

        function scrollToTop()
        {
            vm.game_index = 0;
            vm.buffer_index = 0;
            scrollTo(0);

            setGame();
        }


        // above for all games in list
        function selectAll()
        {
            selectRange(0, vm.filtered.length-1);
        }


        // set the 'selected' flag on a range of games and push to list
        function selectRange(from_index, to_index)
        {
            if (to_index < from_index)    // swap to make smallest first
            {
                to_index = from_index;
                from_index = vm.last_selected_index;
            }
            var game;
            for (var i=from_index; i<=to_index; i++)
            {
                game = vm.filtered[i];
                // already selected ?
                var index = vm.selectedList.indexOf(game);
                if (index == -1)
                {
                    vm.selectedList.push(game);
                    game.selected = true;
                }
            }
        }


        // set game after change to gamelist index
        function setGame()
        {
            if (!vm.filtered)
            {
                return;
            }

            // set the current game by the current index
            GameService.game =
              vm.pageVm.game =
                        vm.game = vm.filtered[vm.game_index];

            if (!vm.game || !ThemeService.system)
            {
                return;
            }

            // change system and view to that of current game
            // (moving in the 'all' list)
            if (vm.system.substring(0,4)=='auto'
                  && !ThemeService.theme.systems[vm.system])
            {
                GameService.checkSystemTheme(vm.game.sys);
            }

            GameService.rememberGameMetadata(vm.game);
        }


        // change the current game index and set game
        function setGameByIndex(game_index)
        {
            vm.game_index = game_index;
            setGame();
        }

        function setOrderBy(orderby)
        {
            // if click same column twice reverse the order
            if(vm.orderby == orderby)
                orderby.reverse = !orderby.reverse;
            else
                vm.orderby = orderby;

            checkGameStillVisible();
        }

        function toggleField(field)
        {
            field.show = !field.show;

            // count fields shown
            var shown = 0;
            angular.forEach(GameService.list_fields, function(f) {
                if (f.show)
                    shown++;
            });

            if (shown==0)
            {
                ThemeService.resetView(ThemeService.view);
                return;
            }

            // if back to just name field then reset
            if (shown == 1 && GameService.list_fields[0].show)
            {
                vm.header = 0;
                applyFieldsShown();
                ThemeService.resetView(ThemeService.view);
                return;
            }

            // more than one field, show header
            vm.header = 1;
            applyFieldsShown();
        }

        // change selected flag, push or pop to list
        function toggleSelected(game)
        {
            game.selected = !game.selected;

            if (game.selected)  // remember for selecting range
            {
                vm.last_selected_index = vm.filtered.indexOf(game);
            }

            var index = vm.selectedList.indexOf(game);
            if (index == -1 && game.selected)  // push
            {
                vm.selectedList.push(game);
            }
            else if (index >= 0 && !game.selected) // pop
            {
                vm.selectedList.splice(index, 1);
            }
        }

        function toggleStretch()
        {
            if (!config.themes)
            {
                config.themes = {};
            }
            config.themes['stretch-'+config.app.ThemeSet] = !config.themes['stretch-'+config.app.ThemeSet];

            config.save('stretch-'+config.app.ThemeSet, config.themes['stretch-'+config.app.ThemeSet], 'bool', config.THEMES);

            ThemeService.resetView(ThemeService.view);
            applyFieldsShown();
        }
    }

})();
