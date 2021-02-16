/**
 * style.service.js
 */
(function() {

    'use strict';

    angular
        .module('WebtroPie.styler_service', [])
        .service('styler', styler);

    styler.$inject = ['config','util','$document'];
        
    function styler(config, util, $document)
    {
        var self = this;

        // arrays for dynamically loaded content
        self.fonts = {};
        self.audio = {};
        self.class = {}; // dynamic classes for logo transitions

        self.defaultLineSpacing = 1.5;
        self.defaultCarousel = {
            systemcarousel: {
                name: 'systemcarousel',
                type: 'horizontal',  // anything other than 'vertical' is horiczontal
                pos:  {x: 0, y: 0.383},
                size: {w: 1, h: 0.232},
                color: '#FFFFFFD8',
                maxLogoCount: 3,
                logoScale: 1.4,
                logoSize: {w: 0.24, h: 0.14},
                fontSize: 0.16,
                zIndex: 40
            },
            systemInfo: {
                name: 'systemInfo',
                pos:  {x: 0, y: 0.615},
                size: {w: 1, h: 0.063},
                backgroundColor: '#DCDCDCD8',
                color: '#555',
                alignment: 'center',
                fontSize: 0.04,
                lineSpacing: 1,
                zIndex: 50
            },
            logoText: {
                name: 'logoText',
                color: '#222',
                alignment: 'center',
                fontSize: 0.05,
                forceUppercase: false,
                fontFamily: 'ohc_regular'
            }
        };

        // public functions

        self.calcObjBounds = calcObjBounds;
        self.changeCarousel = changeCarousel;
        self.clearSystem = clearSystem;
        self.createCarouselStyle = createCarouselStyle;
        self.createCarsouselClasses = createCarsouselClasses;
        self.createImageStyle = createImageStyle;
        self.createLogoTextStyle = createLogoTextStyle;
        self.createTextStyle = createTextStyle;
        self.createRatingStyle = createRatingStyle;
        self.createVideoStyle = createVideoStyle;
        self.createViewStyles = createViewStyles;
        self.denormalize = denormalize;
        self.fullpath = fullpath;
        self.fullImagePaths = fullImagePaths;
        self.getAudioId = getAudioId;
        self.insertIntoView = insertIntoView;
        self.loadAudio = loadAudio;
        self.loadFontFamily = loadFontFamily;
        self.loadFonts = loadFonts;
        self.loadMedia = loadMedia;
        self.loadSounds = loadSounds;
        self.objectReposition = objectReposition;
        self.saveFilepath = saveFilepath;
        self.setHelpbarStyle = setHelpbarStyle;
        self.setSystem = setSystem;
        self.setSystemImagesContainerStyle = setSystemImagesContainerStyle;
        self.setSystemLogoStyle = setSystemLogoStyle;

        self.styleAlignment = styleAlignment;
        self.styleBackgroundColor = styleBackgroundColor;
        self.styleColor = styleColor;
        self.styleForceUppercase = styleForceUppercase;
        self.styleFontFamily = styleFontFamily;
        self.styleFontSize = styleFontSize;
        self.styleImagePathColorTile = styleImagePathColorTile;
        self.styleImageMaxSize = styleImageMaxSize;
        self.styleImageZIndex = styleImageZIndex;
        self.styleOrigin = styleOrigin;
        self.stylePos = stylePos;
        self.styleRatingSize = styleRatingSize;
        self.styleRatingZIndex = styleRatingZIndex;
        self.styleRotation = styleRotation;
        self.styleSize = styleSize;
        self.styleTextZIndex = styleTextZIndex;
        self.styleVideoMaxSize = styleVideoMaxSize;
        self.styleVideoZIndex = styleVideoZIndex;

        self.variableReplace = variableReplace;
        self.xReposition = xReposition;

        function calcObjBounds(obj)
        {
            // not a thing we can move
            if (!obj.pos)
            {
                return;
            }
            var size = obj.size || obj.maxSize;
            if(!size || size.w==1 || !size.h)
            {
                return;
            }
            obj.top = obj.pos.y
            obj.left = obj.pos.x
            obj.bottom = obj.pos.y + size.h;
            obj.right = obj.pos.x + size.w;
            if (obj.origin)
            {
                obj.top -= size.h * obj.origin.y;
                obj.left -= size.w * obj.origin.x;
                obj.bottom -= size.h * obj.origin.y;
                obj.right -= size.w * obj.origin.x;
            }
        }

        // alter attributes (while dragging) of each logo and images container
        function changeCarousel(pct)
        {
            angular.forEach(self.carousel.logos, function(cell) {
                setSystemLogoStyle(cell, pct)
            });
            angular.forEach(self.carousel.backgrounds, function(cell) {
                setSystemImagesContainerStyle(cell, pct)
            });
        }

        function clearSystem()
        {
            self.replaceSystemName = null;
        }

        function createCarouselStyle(carousel)
        {
            // alredy done?
            if (!carousel || (typeof carousel) != 'object')
            {
                carousel = {};
            }
            // alredy done?
            if (carousel.style)
            {
                createCarsouselClasses(carousel);
                return;
            }

            if (!carousel.type)
            {
                carousel.type = 'horizontal';
            }

            var style = {};

            if (carousel.pos)
            {
                carousel.pos = denormalize('pos',carousel.pos);
            }
            else
            {
                carousel.pos = self.defaultCarousel.systemcarousel.pos;
            }
            style.left = util.pct(carousel.pos.x,'vw');
            style.top = util.pct(carousel.pos.y,'vh');

            if (carousel.size)
            {
                carousel.size = denormalize('size',carousel.size);
            }
            else
            {
                carousel.size = self.defaultCarousel.systemcarousel.size;
            }
            if (carousel.size.w)
            {
                style.width = util.pct(carousel.size.w,'vw');
            }
            if (carousel.size.h)
            {
                style.height = util.pct(carousel.size.h,'vh');
            }

            if (carousel.maxLogoCount)
            {
                carousel.maxLogoCount = parseFloat(carousel.maxLogoCount);
            }
            else
            {
                carousel.maxLogoCount = 3;
            }

            if (carousel.logoScale)
            {
                carousel.logoScale = parseFloat(carousel.logoScale);
            }
            else
            {
                carousel.logoScale = self.defaultCarousel.systemcarousel.logoScale;
            }


            carousel.midX = carousel.pos.x + carousel.size.w / 2;
            carousel.midY = carousel.pos.y + carousel.size.h / 2;

            if (carousel.logoSize)
            {
                carousel.logoSize = denormalize('size',carousel.logoSize);
            }
            else
            {
                if (carousel.size == self.defaultCarousel.systemcarousel.size)
                {
                    carousel.logoSize =  self.defaultCarousel.systemcarousel.logoSize;
                }
                else
                {
                    carousel.logoSize = {h: 0.9 * carousel.size.h / ( carousel.logoScale * carousel.maxLogoCount ),
                                                w: 0.9 * carousel.size.w / carousel.logoScale };
                }
            }

            if (!carousel.color)
            {
                carousel.color = self.defaultCarousel.systemcarousel.color;
            }

            if (carousel.zIndex)
            {
                carousel.zIndex = parseInt(carousel.zIndex);
            }
            else
            {
                carousel.zIndex = self.defaultCarousel.systemcarousel.zIndex;
            }

            if (!carousel.fontSize)
            {
                carousel.fontSize = self.defaultCarousel.systemcarousel.fontSize;
            }

            if (carousel.logoRotationOrigin)
            {
                carousel.logoRotationOrigin = denormalize('pos',carousel.logoRotationOrigin);
            }

            style['background-color'] = util.hex2rgba(carousel.color);
            style['color'] =  '#222';
            style['z-index'] = carousel.zIndex;

            carousel.style = style;

            if (carousel.type == 'vertical')
            {
                carousel.logo_vw = carousel.size.w;
                carousel.logo_vh = carousel.size.h / carousel.maxLogoCount;
            }
            else if (carousel.type == 'vertical_wheel')
            {
                carousel.logo_vw = carousel.logoSize.w;
                carousel.logo_vh = carousel.logoSize.h;
            }
            else
            {
                carousel.logo_vw = carousel.size.w / carousel.maxLogoCount;
                carousel.logo_vh = carousel.size.h;
            }

            createCarsouselClasses(carousel);
        }

        function createCarsouselClasses(carousel)
        {
            self.carousel = carousel;
            carousel.logos = [];
            carousel.backgrounds = [];
            var range = Math.floor(carousel.maxLogoCount/2)+2;
            carousel.loIndex = -range;
            carousel.hiIndex = range;
            // create container attributes for each logo
            // and classes that can be animated
            for (var index = carousel.loIndex; index <= carousel.hiIndex; index++)
            {
                var cell = {index: index};

                var temp_cell = angular.copy(cell);
                setSystemLogoStyle(temp_cell, 0);  // 0 is the resting position (i.e. not dragged)
                createClass('logo'+index, temp_cell);

                carousel.logos.push(cell);
            }

            // create previous, current and next background images container attributes
            // and classes that can be animated
            for (var index = carousel.loIndex; index <= carousel.hiIndex; index++)
            {
                var cell = {index: index};

                var temp_cell = angular.copy(cell);
                setSystemImagesContainerStyle(temp_cell, 0);
                createClass('system_images'+index, temp_cell)

                carousel.backgrounds.push(cell);
            }
        }

        // convert attirbutes container into a css class for animation
        function createClass(className, style_array)
        {
            var style;

            if (self.class[className])
            {
                style = self.class[className];
                style.parentNode.removeChild(style);
                //document.removeChild();
            }
            style = document.createElement('style');
            style.type = 'text/css';
            
            // create the class string
            var str = '.'+className+' { '
            angular.forEach(style_array, function(value, key) {
                if (key != 'index')
                {
                    str += key + ': ' + value + ';';
                }
            })
            str += ' }';

            style.innerHTML = str;

            document.getElementsByTagName('head')[0].appendChild(style);

            self.class[className] = style; // save for later removal
        }

        function createDatetimeStyle(datetime)
        {
            createTextStyle(datetime);
            datetime.tag = 'datetime';

            if (datetime.name == 'md_lastplayed')
            {
                datetime.format = 'ago';
            }
        }

        function createHelpsystemStyle(helpsystem)
        {
            createTextStyle(helpsystem);
            helpsystem.tag = 'helpsystem';
        }

        // convert theme image attributes to style
        function createImageStyle(image)
        {
            image.tag = 'image';

            // skip non image
            if (!image || (typeof image) != 'object' || !image.name || image.style)
            {
                return;
            }
            image.style = {position: 'absolute'};

            if (stylePos(image, image.style) || image.name == 'logo')
            {
                delete image.transformRotation;
                delete image.transformOrigin;
                styleSize(image, image.style);
                styleImageMaxSize(image, image.style);
                styleOrigin(image, image.style);
                styleRotation(image, image.style);
                calcObjBounds(image);
                styleImagePathColorTile(image, image.style);
                styleImageZIndex(image, image.style);
            }
         }


        // set up position, background / foregrund stars
        function createRatingStyle(rating)
        {
            rating.tag = 'rating';
            if(!rating || (typeof rating) != 'object' || rating.style)
            {
                return;
            }

            var style = {position: 'absolute'}
            var stars = {}

            rating.pos = denormalize('pos',rating.pos);
            if (!rating.pos)
            {
                rating.anchor_label = true;
                style.display = 'none';
            }
            else if (rating.pos.x>=1 || rating.pos.y>=1)
            {
                style.display = 'none';
            }
            else
            {
                style.left = util.pct(rating.pos.x,'vw');
                style.top = util.pct(rating.pos.y,'vh');

                styleRatingSize(rating, style);

                if (rating.fullunfilledPath)
                {
                    style['background-image'] = 'url("' + rating.fullunfilledPath + '")';
                }
                if (rating.fullfilledPath)
                {
                    stars['background-image'] = 'url("' + rating.fullfilledPath + '")';
                }
                styleRatingZIndex(rating, style);
            }
            calcObjBounds(rating);
            rating.style = style;
            rating.stars = stars;
        }

        // convert theme text attributes to style
        function createTextStyle(text)
        {
            if (!text || (typeof text) != 'object' || text.style)
            {
                return;
            }
            text.tag = 'text';
            text.style = {};
            text.inner = {};

            if (!stylePos(text, text.style))
            {
                return;
            }

            styleFontSize(text, text.inner);

            if (text.name == "help")
            {
                if (!text.textColor)
                {
                    text.textColor = '777777';
                }
                if (!text.iconColor)
                {
                    text.iconColor = '777777';
                }
                text.style.color = '#'+text.textColor.substring(0,6);
            }
            else if (text.anchor_label)
            {
                text.style.left = '100%';
                text.style.top = '0';
                text.inner['margin-left'] = util.pct(text.fontSize * 0.75,'vmin');
                if (!text.fontFamily)
                {
                    text.inner['font-family'] = 'ohc_regular';
                }
            }
            else if (!text.pos)
            {
                text.style.display = 'none';
                return;
            }

            // default size for helpsystembar
            if (text.name == "help" && !text.size)
            {
                text.size = {w: text.pos
                                     ? 1 - text.pos.x  // to right edge
                                     : 1,                  // full width
                                 h: text.fontSize
                                     ? text.fontSize + 0.01  // padding 
                                     : 0.045};
            }

            styleSize(text, text.style);
            text.inner.width = text.style.width;

            if (!text.lineSpacing)
            {
                text.lineSpacing = self.defaultLineSpacing;
            }
            else
            {
                text.lineSpacing = util.round(text.lineSpacing * 1.03, 4);
            }

            calcObjBounds(text);

            if (text.size)
            {
                if (text.size.w)
                {
                    text.style['max-width'] = text.style.width;
                }
            }

            if (text.name == 'md_description')
            {
                text.multiline = true;
            }

            var height = text.fontSize * self.defaultLineSpacing; // text.lineSpacing

            if (text.size && text.size.h)
            {
                height = text.size.h;
            }

            text.style.height = util.pct(height,'vh');

            text.rows = Math.floor(height / text.fontSize) || 1;
            if (text.multiline && text.lineSpacing)
            {
                if (text.name != 'gamelist')
                {
                    text.inner['line-height'] = text.lineSpacing;
                }
            }

            styleColor(text, text.inner);
            styleBackgroundColor(text, text.style);
            styleAlignment(text, text.inner);
            styleFontFamily(text, text.inner);
            styleForceUppercase(text, text.inner);
            styleTextZIndex(text, text.style);
        }

        function createLogoTextStyle(logoText)
        {
            ['color','forceUppercase','fontSize','alignment','fontFamily']
            .forEach(function(key) {
                if (!logoText[key])
                {
                    logoText[key] = self.defaultCarousel.logoText[key];
                }
            });
            logoText.styled = false;
            logoText.style = {};
            logoText.inner = {};
            styleForceUppercase(logoText, logoText.inner);
            styleFontSize(logoText, logoText.inner);
            styleFontFamily(logoText, logoText.inner);
            styleColor(logoText, logoText.inner);
            styleLogoAlignment(logoText, logoText.style);

            logoText.styled = true;
            self.logoText = logoText;
        }

        function createTextlistStyle(textlist)
        {
            createTextStyle(textlist);
            textlist.tag = 'textlist';
            textlist.selectorOffsetY = parseFloat(textlist.selectorOffsetY || 0);
            textlist.fontSize        = parseFloat(textlist.fontSize);
            textlist.selectorHeight  = parseFloat(textlist.selectorHeight);
            textlist.lineSpacing     = parseFloat(textlist.lineSpacing);

            if (textlist.fullselectorImagePath)
            {
                textlist.selector = {
                     'background-image': 'url("'+textlist.fullselectorImagePath+'")',
                     'height': util.pct(textlist.selectorHeight,'vh'),
                     'width': util.pct(textlist.size.w,'vw')
                }
            }
        }

        function createVideoStyle(video)
        {
            video.tag = 'video';

            if (!video || (typeof video) != 'object' || video.style || !video.pos)
            {
                return;
            }

            video.style = { position: 'absolute', 'object-fit': 'fill' };

            if (!stylePos(video, video.style))
            {
                return;
            }

            if (video.showSnapshotNoVideo == 'true')
            {
                video.style['background-size'] = 'contain';
                video.style['background-repeat'] = 'no-repeat';
            }

            // default video origin center
            if (!video.origin)
            {
                video.origin = '0.5 0.5';
            }

            delete video.style.transform;
            styleOrigin(video, video.style);
            styleSize(video, video.style);
            styleVideoMaxSize(video, video.style);

            var bp_h = 'center';
            var bp_v = 'center';
            if (video.origin)
            {
                if (video.origin.x == 0)
                {
                    bp_h = 'left';
                }
                else if (video.origin.x == 1)
                {
                    bp_h = 'right';
                }
                if (video.origin.y == 0)
                {
                    bp_v = 'top';
                }
                else if (video.origin.y == 1)
                {
                    bp_v = 'bottom';
                }
            }

            video.style['background-position'] = bp_h + ' ' + bp_v;

            calcObjBounds(video);

            styleVideoZIndex(video, video.style);
        }

        // convert theme view object attributes to styles
        function createViewStyles(view, keep_style, system_name, default_system)
        {
            if (!view)
            {
                return;
            }
            // system carousel update
            if (view.name == 'system' && !keep_style)
            {
                if (!view.carousel)
                {
                    view.carousel = angular.copy(self.defaultCarousel);
                }
                createCarouselStyle(view.carousel.systemcarousel);
                if (!view.text)
                {
                    view.text = {};
                }

                if (!view.text.systemInfo && default_system.text.systemInfo)
                {
                    view.text.systemInfo = angular.copy(default_system.text.systemInfo);
                }
                else if (!view.text.systemInfo)
                {
                    self.defaultCarousel.systemInfo.size.w = 1;
                    view.text.systemInfo = angular.copy(self.defaultCarousel.systemInfo);
                }
                if (!view.text.systemInfo.size)
                {
                    view.text.systemInfo.size = self.defaultCarousel.systemInfo.size;
                }

                if (!view.text.logoText && default_system.text.logoText)
                {
                    view.text.logoText = angular.copy(default_system.text.logoText);
                }
                else if (!view.text.logoText)
                {
                    view.text.logoText = angular.copy(self.defaultCarousel.logoText);
                }
                createSystemInfoStyle(view.text.systemInfo);
                createLogoTextStyle(view.text.logoText);
            }

            // already done ?
            if (!view.styled)
            {
                setSystem(system_name);
                angular.forEach(view.text,        createTextStyle);
                angular.forEach(view.textlist,    createTextlistStyle);
                angular.forEach(view.datetime,    createDatetimeStyle);
                angular.forEach(view.image,       createImageStyle);
                angular.forEach(view.rating,      createRatingStyle);
                angular.forEach(view.helpsystem,  createHelpsystemStyle);
                angular.forEach(view.video,       createVideoStyle);
                clearSystem();
                
                // if text or date anchored to label float label left
                if (view.text)
                angular.forEach(config.lang.md_label, function(label_text, md) {
                    var label = view.text['md_lbl_'+md];
                    var text = view.text['md_'+md];
                    if (!text && view.datetime)
                    {
                        text = view.datetime['md_'+md];
                    }
                    if (label && text && text.anchor_label)
                    {
                        label.style.float = 'left';
                    }
                });

                view.styled = true;
            }
        }

        function createSystemInfoStyle(systemInfo)
        {
            ['pos','size','color','backgroundColor','alignment','fontSize','lineSpacing']
            .forEach(function(key) {
                if (!systemInfo[key])
                {
                     systemInfo[key] = self.defaultCarousel.systemInfo[key];
                }
            });
            systemInfo.styled = false;
            delete systemInfo.style;
            createTextStyle(systemInfo);
            self.systemInfo = systemInfo;
        }


        // convert string float pair into object
        // E.g. "0 1" to {x: 0, y: 1}
        function denormalize(type, str)
        {
            if (!str || typeof str != 'string')
            {
                return str;
            }

            if (str.match(/-*[0-9\.][0-9\.]*[, ]+-*[0-9\.][0-9\.]*/))
            {
                var arr = str.split(/[, ]+/);
                if (type=='pos')
                {
                    return { x : parseFloat(arr[0]), y : parseFloat(arr[1])};
                }
                else if (type=='size')
                {
                    return { w : parseFloat(arr[0]), h : parseFloat(arr[1])};
                }
                else
                {
                    return arr;
                }
            }
            else
                return str;
        }

        function saveFilepath(object, field, path)
        {
            object[field+'_filepath'] = path;
            object['full'+field] = fullpath(object, field);
        }

        // translate path relative to file/include file
        // then simplify
        function fullpath(element, field)
        {
            var path;

            if (element[field])
            {
                path = element[field];
                if (self.replaceSystemName)
                {
                    path = variableReplace(path, self.replaceSystemName);
                }
                if (path.substr(0,2) == './')  // strip ./
                {
                    path = path.slice(2);
                }
                path = element[field+'_filepath']+'/'+path; // create full path
                path = path.replace(/[^\/]*\/\.\.\//, '');
                path = path.replace(/[^\/]*\/\.\.\//, '');
            }

            return path
        }

        function fullViewImagePaths(view, path, include_count)
        {
            angular.forEach(view.video, function(video)
            {
                if (video.default)
                {
                    saveFilepath(video, 'default', path);
                }
            });

            angular.forEach(view.image, function(image)
            {
                if (image.name && image.path)
                {
                    saveFilepath(image, 'path', path);
                    image.include_count = include_count;
                }
                if (image.name && image.default)
                {
                    saveFilepath(image, 'default', path);
                    image.include_count = include_count;
                }
            });

            if(view.textlist &&
                view.textlist.gamelist &&
                view.textlist.gamelist.selectorImagePath)
            {
                saveFilepath(view.textlist.gamelist, 'selectorImagePath', path);
            }

            // expand paths of rating star images if themed
            if (view.rating && view.rating.md_rating)
            {
                if (view.rating.md_rating.unfilledPath)
                {
                    saveFilepath(view.rating.md_rating, 'unfilledPath', path);
                }
                if (view.rating.md_rating.filledPath)
                {
                    saveFilepath(view.rating.md_rating, 'filledPath', path);
                }
            }
        }

        // Store full image path relative to the file it was included in
        // (so that the path doesn't get lost after expansion)
        function fullImagePaths(themefile, path, include_count)
        {
            if (!themefile || !themefile.view)
            {
                return;
            }

            angular.forEach(themefile.view, function(view)
            {
                fullViewImagePaths(view, path, include_count)
            });
        }

        // generate an id from the filename
        function getAudioId(filename, path)
        {
            if (filename)
            {
                if (filename.substr(0,2) == './')
                {
                    filename = filename.slice(2);
                }
                var fullpath = path+'/'+filename;

                fullpath = fullpath
                                  .replace(/[^\/]*\/\.\.\//g, '') // replace parent/../ with ''
                var id = fullpath
                                  .replace(/(\/|-)/g, "_")        // replace /, - with _
                                  .replace(/(\..*|\/)/g, '')     // remove extension
                                  .substring(11);                    // remove 'svr/themes'
                loadAudio(id, fullpath);
                return id;
            }
        }

        // Insert object (column of gamelist) into view
        // but only between top and bottom of gamelist
        function insertIntoView(view, insert_x, width, gamelist_top, gamelist_bottom)
        {
            angular.forEach(view.image, function(image)
            {
                objectReposition(image, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.text, function(text)
            {
                objectReposition(text, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.datetime, function(text)
            {
                objectReposition(text, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.textlist, function(textlist)
            {
                objectReposition(textlist, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.rating, function(rating)
            {
                objectReposition(rating, insert_x, width, gamelist_top, gamelist_bottom);
            });
            angular.forEach(view.video, function(video)
            {
                objectReposition(video, insert_x, width, gamelist_top, gamelist_bottom);
            });
/*
            angular.forEach(view.marquee, function(marquee)
            {
                objectReposition(marquee, insert_x, width, gamelist_top, gamelist_bottom);
            });
*/
/*
            if (!self.orig_width)
            {
                self.orig_width = $window.outerWidth;
                self.orig_height = $window.outerHeight;
            }

            // increase the window size,  worth a go but most browser wont comply
            // so the scale will appear to change instead of the window expanding
            //$window.resizeTo($window.innerWidth * ( 1 + width ), $window.innerHeight);
            $window.resizeTo(self.orig_width * ( 1 + width ), self.orig_height);
*/
        }

        function joinTransform(element, style)
        {
            delete style.transform;
            delete style['-ms-transform'];
            delete style['-webkit-transform'];

            if (element.transformOrigin)
            {
                style.transform = element.transformOrigin;
                if (element.transformRotation)
                {
                    style.transform += ' ' +element.transformRotation;
                }
            }
            else if (element.transformRotation)
            {
                style.transform = element.transformRotation;
            }
            else {
                return;
            }
            style['-ms-transform'] = style['-webkit-transform'] = style.transform;
        }

        // dynamically create audio element and its source,
        // store audio element in an array for later lookup
        function loadAudio(id, filename)
        {
            if (self.audio[id]) // already loaded
            {
                return;
            }

            var audio = document.createElement('audio');
            var source = document.createElement('source');
            source.src=filename;
            audio.appendChild(source);

            self.audio[id] = audio;
        }


        // dynamically load the font face
        function loadFontFamily(text, theme)
        {
            if (self.fonts[text.fontFamily]) // already loaded
            {
                return;
            }

            var font = theme.fonts[text.fontFamily];
            var style_el = $document[0].createElement('style');
            style_el.innerHTML = "@font-face {font-family: '" + text.fontFamily + "';"+
                                          "src: url('" + font.fullpath + "') format('truetype');}";
            $document[0].body.appendChild(style_el);
            font.style_el = style_el;
            self.fonts[text.fontFamily] = font;
        }

        // Store full font path relative to the file it was included in
        // (so that the path doesn't get lost after expansion)
        function loadFonts(theme, themefile, path, type)
        {
            if (!themefile || !themefile.view)
            {
                return;
            }

            angular.forEach(themefile.view, function(view)
            {
              angular.forEach(view[type], function(text)
              {
                  if (text.name && text.fontFamily)
                  {
                      loadFontFamily(text, theme);
                  }
              });
              if (view.helpsystem && view.helpsystem.help.fontFamily)
              {
                  loadFontFamily(view.helpsystem.help, theme);
              }
              if (view.carousel)
              {
                  if (view.carousel.systemcarousel &&
                        view.carousel.systemcarousel.fontFamily)
                  {
                      loadFontFamily(view.carousel.systemcarousel, theme);
                  }
                  if (view.carousel.systemInfo &&
                        view.carousel.systemInfo.fontFamily)
                  {
                      loadFontFamily(view.carousel.systemInfo, theme);
                  }
              }
            });
        }

        function loadMedia(theme, node, path, include_count)
        {
            fullImagePaths(node, path, include_count);
            loadFonts(theme, node, path, 'text');
            loadFonts(theme, node, path, 'textlist');
            loadFonts(theme, node, path, 'datetime');
            loadFonts(theme, node, path, 'helpsystem');
            loadSounds(node, path);
        }

        // dynamically load all sounds
        function loadSounds(themefile, path)
        {
            if (!themefile || !themefile.view)
            {
                return;
            }
            angular.forEach(themefile.view, function(view)
            {
                if (view.textlist)
                {
                    angular.forEach(view.textlist, function(textlist) {
                        if (textlist.scrollSound)
                            textlist.scrollsoundaudio_id =
                                 getAudioId(textlist.scrollSound, path);
                    });
                }
                if (view.sound)
                {
                    angular.forEach(view.sound, function(sound)
                    {
                        if (sound.path)
                        {
                            sound.audio_id = getAudioId(sound.path, path);
                        }
                    });
                }
            });
        }

        // change an 'obj' position and size when 'width' is inserted at 'insert_x'
        // if width==0 means reset view back to orig theme values
        function objectReposition(obj, insert_x, width, gamelist_top, gamelist_bottom)
        {
            // not a thing we can move
            if (!obj.style || !obj.pos)
            {
                return;
            }

            // above or below gamelist
            if( obj.top >= gamelist_bottom || obj.bottom <= gamelist_top)
            {
                return;
            }

            // position
            var x = width
                      ? xReposition(obj.pos.x, insert_x, width)  // move/scale
                      : obj.pos.x;  // reset back to normal

            // apply position change to style
            obj.style['left'] = util.pct(x,'vw');

            // size
            var w;
            if (obj.size)
            {
                w = width
                      ? xReposition(obj.pos.x + obj.size.w, insert_x, width) - x  // move/scale
                      : obj.size.w;  // reset back to normal
            }
            else if (obj.maxSize)
            {
                w = width
                      ? xReposition(obj.pos.x + obj.maxSize.w, insert_x, width) - x  // move/scale
                      : obj.maxSize.w;  // reset back to normal
            }

            // apply size change to style
            if (w)
            {
                if (obj.style)
                {
                    if (obj.style['max-width'])
                    {
                        obj.style['max-width'] = util.pct(w,'vw');
                    }
                    if (obj.name == 'md_rating')
                    {
                        obj.style.width  = (100 * w) +'vh';
                        obj.style.height = (100 * w / 5) +'vh';
                    }
                    else if (obj.style['width'])
                    {
                        obj.style['width'] = util.pct(w,'vw');
                    }
                }
            }
        }

        function setHelpbarStyle(view, system)
        {
            // look for helpbar style in :-
            //     current view
            //     otherwise use system view
            var help;

            if (view && view.helpsystem)
            {
                help = view.helpsystem.help
            }
            else if (system &&
                        system.view &&
                        system.view.system &&
                        system.view.system.helpsystem)
            {
                help = system.view.system.helpsystem.help;
            }
            else {
                help = {};
            }

            if (!help.style)
            {
                help.style = {};
            }

            if(help.fontSize)
            {
                help.style['font-size'] = util.pct(help.fontSize, 'vh');
            }
            help.style['line-height'] = (help.height / help.fontSize) + '%';

            if (help)
            {
                // already done?
                if (self.help == help) return;

                self.help = help;
            }

            // set up styles
            if (!self.helpTextColorBorder)    self.helpTextColorBorder = {}
            if (!self.helpInverseBackground) self.helpInverseBackground = {}

            // Defaults if not included within theme
            var pos = {x: 0, y: 0.945};
            self.helpTextColor = '777777';
            self.helpIconColor = '777777';

            if (help)
            {
                if (help.textColor) self.helpTextColor = help.textColor;
                if (help.iconColor) self.helpIconColor = help.iconColor;
                if (help.pos)
                {
                    help.pos = denormalize('pos',help.pos);

                    // If theme hides the helpbar, show at bottom
                    if (help.pos.x>=1 || help.pos.y>=1 ||
                         help.pos.x<0 || help.pos.y<0)
                    {
                        help.pos = pos;
                        delete help.style['font-size'];

                        help.style.left = util.pct(help.pos.x,'vw');
                        help.style.top = util.pct(help.pos.y,'vh');
                        delete help.style.display;
                    }
                    else
                    {
                        pos = help.pos;
                    }
                }

            }
            self.helpInverseBackground['background-color'] = '#'+self.helpTextColor.substring(0,6);

            self.helpMenuOptionClasses = 'dropdown-options';
            self.helpMenuOptionClasses += ' ' + (util.isLight(self.helpTextColor) ? 'dark':'light');
            self.helpMenuOptionClasses += ' ' + (pos.y < 0.5 ? 'down':'up');
            self.helpMenuOptionClasses += ' ' + (pos.x < 0.3 ? '':'right');

            if (util.isLight(self.helpTextColor))
            {
                self.helpInverseForegroundClass = 'inverseDarkForeground';
            }
            else
            {
                self.helpInverseForegroundClass = 'inverseLightForeground';
            }

            self.helpTextColorBorder.color = '#'+self.helpTextColor.substring(0,6);
            self.helpTextColorBorder.border = '1px solid #'+self.helpTextColor.substring(0,6);
        }

        function setSystem(system_name)
        {
            self.replaceSystemName = system_name;
        }

        // for animating system images when carousel changes
        function setSystemImagesContainerStyle(cell, pct)
        {
            //var cell = {position: 'absolute'};
            cell.position = 'absolute';
            var left = null
            var top = null;
            var width = 1;
            var height = 1;
            var opacity = null;

            // vertical scroll
            if ( config.app.ViewTransitions=='Slide')
            {
                if ( self.carousel.type == 'vertical' || self.carousel.type == 'vertical_wheel')
                {
                    // work in units of logo distance rather than screen position
                    // so 1 = mouse movement between two logos
                    // instead of a full screen
                    pct /= self.carousel.logo_vh;
                
                    if (pct == 0)
                    {
                        top = cell.index;
                    }
                    else
                    {
                        top = cell.index * (1 - pct) + (cell.index + 1) * pct;
                    }
                    left = 0;
                }
                else
                {
                    pct /= self.carousel.logo_vw;

                    top = 0;
                    if (pct == 0)
                    {
                        left = cell.index;
                    }
                    else
                    {
                        left = cell.index * (1 - pct) + (cell.index + 1) * pct;
                    }
                }
            }
            else if ( config.app.ViewTransitions=='Fade')
            {
                if(cell.index==-1)
                {
                    opacity = 0;
                }
                else if(cell.index==0)
                {
                    opacity = 1;
                }
                else
                {
                    opacity = 0;
                }
            }

            if (left != null)
            {
                cell.left    = util.pct(left,'vw');
                cell.top     = util.pct(top,'vh');
            }
            if (opacity != null)
            {
                cell.opacity = opacity;
            }

            cell.width  = util.pct(width,'vw');
            cell.height = util.pct(height,'vh');

            //createClass('system_images'+cell.index, style);
        }


        function setSystemLogoStyle(cell, pct)
        {
            var index;
            var left = null;
            var top = null;
            var height;
            var width;
            var scale;
            var fontsize;
            var opacity;
            var zIndex = parseInt(self.carousel.zIndex) || 40;
            
            cell.position = 'absolute';
            cell.top = '50%';
            cell.left = '50%';
            cell['-webkit-transform'] =
            cell['-ms-transform'] =
            cell.transform = 'translate(-50%,-50%)';

            if (self.carousel.type == 'vertical')
            {
                 index = cell.index + pct / self.carousel.logo_vh;
                 top    = pct
                            + self.carousel.size.h / 2         // half way vertically in carousel area
                            + cell.index * self.carousel.logo_vh;                // index position
            }
            else if (self.carousel.type == 'vertical_wheel')
            {
                index = cell.index + pct / self.carousel.logo_vh;

                if (self.carousel.logoAlignment == 'left')
                {
                    left = 0.04 + self.carousel.logoSize.w / 2;
                }
                else if (self.carousel.logoAlignment == 'right')
                {
                    left = 0.96 - self.carousel.logoSize.w / 2;
                }

                cell['-ms-transform-origin'] =
                cell['-webkit-transform-origin'] =
                cell['transform-origin'] = util.pct(self.carousel.logoRotationOrigin.x, '%') + ' ' +
                                           util.pct(self.carousel.logoRotationOrigin.y, '%');

                cell.transform += ' rotate('+(index * (parseFloat(self.carousel.logoRotation) || 7.5))+'deg) ';

                cell['-ms-transform'] = cell['-webkit-transform'] = cell.transform;
            }
            else  // horizontal
            {
                 index = cell.index + pct / self.carousel.logo_vw;
                 left  = pct
                            + self.carousel.size.w / 2         // half way horizontally in carousel area
                            + cell.index * self.carousel.logo_vw;                // index position
            }

            if (index==0 || index == '0')    // Center
            {
                 scale = self.carousel.logoScale;
                 cell['z-index'] = zIndex + 3;
                 opacity = 1;
            }
            else if (index > -1 && index < 1)  // almost center
            {
                 pct = Math.abs(index);
                 scale = (self.carousel.logoScale * (1 - pct)) + pct;
                 opacity = 1 - (0.5 * pct); // (1 - pct) + (0.5 * pct);
                 cell['z-index'] = zIndex + 2;
            }
            else
            {
                 scale = 1;
                 opacity = 0.5;
                 cell['z-index'] = zIndex + 1;
            }

            width = self.carousel.logoSize.w * scale;
            height = self.carousel.logoSize.h * scale;
            fontsize = height * self.carousel.fontSize;

            if (left != null)
            {
                cell.left    = util.pct(left,'vw');
            }
            if (top != null)
            {
                cell.top     = util.pct(top, 'vh');
            }
            cell.width  = util.pct(width,'vw');
            cell.height = util.pct(height,'vh');
            cell.opacity = opacity;
            cell['font-size'] = util.pct(fontsize, 'vmin');
        }

        function styleAlignment(element, style)
        {
            if (element.alignment)
            {
                style['text-align'] = element.alignment;
            }
            else
            {
                delete style['text-align'];
            }
        }

        function styleBackgroundColor(element, style)
        {
            if (element.backgroundColor)
            {
                style['background-color'] = util.hex2rgba(element.backgroundColor);
            }
            else
            {
                delete style['background-color'];
            }
        }

        function styleColor(element, style)
        {
            if (element.color)
            {
                style['color'] = util.hex2rgba(element.color);
            }
            else
            {
                delete style['color'];
            }
        }

        function styleFontFamily(element, style)
        {
            if (element.fontFamily)
            {
                style['font-family'] = element.fontFamily;
                if (!element.multiline)
                {
                    var vcenter = (self.fonts[element.fontFamily] && self.fonts[element.fontFamily].vcenter) || -50;
                    style['top'] = '50%';
                    style['-webkit-transform'] = 'translateY('+vcenter+'%)';
                    style['-ms-transform'] = 'translateY('+vcenter+'%)';
                    style['transform'] = 'translateY('+vcenter+'%)';
                }
            }
        }

        function styleFontSize(element, style)
        {
            if (element.fontSize)
            {
                style['font-size'] = util.pct(util.round(element.fontSize,6),'vh');
            }
            else
            {
                //delete style['font-size'];
                style['font-size'] = '5vh';
            }
        }

        function styleForceUppercase(element, style)
        {
            if (parseInt(element.forceUppercase))
            {
                style['text-transform'] = 'uppercase';
            }
            else
            {
                delete style['text-transform'];
            }
        }

        function styleLogoAlignment(element, style)
        {
            if (element.alignment == 'left')
            {
                style.left = 0;
                delete style.transform;
            }
            else if (element.alignment == 'right')
            {
                style.right = 0;
                delete style.transform;
            }
            else
            {
                style.left = '50%';
                style.transform = 'translateX(-50%)';
            }
        }

        function styleImagePathColorTile(element, style)
        {
            element.img = false; // true = use img tag, false = use div background image/colour

            // if called more than once (theme editor changes)
            // then remove previous style
            delete style['background-image'];
            delete style['background-repeat'];
            delete style['background-size'];
            delete style['background-color'];
            delete style.filter;
            delete element.img_src;

            // image file - not just a color
            if (element.path ||
                element.name == 'md_image' ||
                element.name == 'md_marquee' ||
                element.name == 'background')
            {
                // solid colour or image colour tint
                if ( element.color )
                {
                    element.color = element.color.toLowerCase();
                }

                // image file extension
                var ext;
                if (element.path)
                {
                    ext = element.path.slice(-3);
                }

                // path relative to it's source file to fullpath
                element.fullpath = fullpath(element, 'path');
                element.fulldefault = fullpath(element, 'default');

                // methods to tint image
                // greyscale tint can be done cheaply on the client
                // otherwise tint server side if gd installed
                if ( element.color &&
                     element.color != 'ffffff' &&
                     element.color != 'ffffffff' )
                {
                    var hsl = util.rgbToHSL(element.color);

                    // if greyscale color image client side
                    if(hsl.h == 0 && hsl.s == 0 && hsl.l > 0.5)  // light
                    {
                        style.filter = 'brightness('+util.pct(hsl.l,'%')+')';
                        if (hsl.a || hsl.a === 0)
                        {
                            style.filter += ' opacity('+util.pct(hsl.a,'%')+')';
                        }
                    }
                    else if(hsl.h == 0 && hsl.s == 0)  // dark
                    {
                        style.filter = 'invert(100%) saturate(0%)'; // contrast(100%)';
                        style.filter += ' contrast('+util.pct(1-hsl.l,'%')+')';
                        if (hsl.a || hsl.a === 0)
                        {
                            style.filter += ' opacity('+util.pct(hsl.a,'%')+')';
                        }
                    }
                    // color image server side if it's a svg or if php has gd2 library enabled
                    else if (element.fullpath &&
                               (ext=='svg' ||
                                 ( config.env.has_gd && (ext=='png' || ext=='jpg' || ext=='gif'))))
                    {
                        element.fullpath = 'svr/color_img.php?file='+
                                                    element.fullpath.substring(4)+ // remove svr/
                                                    '&color='+element.color;
                    }

                    // and if we don't have php_gd loaded ...
                    // try to taint image to color specified using filters client side (poor)
                    else
                    {
                        // speia is yellow (+60 degrees) so rotate -60 degrees
                        style.filter = 'sepia(100%) saturate(5000%) hue-rotate('+((hsl.h-60)%360)+'deg)';
                        if (hsl.a)
                        {
                            style.filter += ' opacity('+util.pct(hsl.a,'%')+')';
                        }
                    }
                }

                // div background tiled
                if (element.tile && element.tile != 'false')
                {
                    style['background-repeat'] = 'repeat';
                }
                // div background fullscreen
                if (element.name=='background' || (element.size && element.size.w >=1 && element.size.h >=1))
                {
                    element.fullscreen = true;
                    if (!style['background-repeat'])
                    {
                        style['background-size'] = '100% 100%';
                    }
                    style.width = '100vw';
                    style.height = '100vh';
                }

                // carousel logo
                else if (element.name=='logo' && !element.pos)
                {
                    delete style.display;
                    style['max-width'] = '100%';
                    style['max-height'] = '100%';
                    style.top = '50%';
                    style.left = '50%';
                    style.transform = 'translate(-50%,-50%)';
                    element.img = true;
                }
                // img tag
                else
                {
                    element.img = true;
                }
            }
            // image is just a color with no image so just set background color
            else if (element.color)
            {
                style['background-color'] = util.hex2rgba(element.color);
            }

            if (element.img)
            {
                if (element.fullpath)
                {
                    element.img_src = element.fullpath;
                }
            }
            else
            {
                if (element.fullpath)
                {
                    style['background-image'] = 'url("'+element.fullpath+'")';
                }
            }
        }

        function styleImageMaxSize(element, style)
        {
            if (element.maxSize)
            {
                element.maxSize = denormalize('size', element.maxSize);
                if (element.maxSize.w)
                {
                    style['max-width'] = util.pct(element.maxSize.w, 'vw');
                }
                if (element.maxSize.h)
                {
                    style['max-height'] = util.pct(element.maxSize.h, 'vh');
                }
            }
        }

        function styleImageZIndex(element, style)
        {
            if (element.zIndex)
            {
                style['z-index'] = parseInt(element.zIndex);
            }
            else if (element.name == 'background')
            {
                style['z-index'] = 1;
            }
            else if(element.extra)
            {
                style['z-index'] = 10;
            }
            else if (element.name == 'md_image')
            {
                style['z-index'] = 30;
            }
            else if (element.name == 'md_video')
            {
                style['z-index'] = 30;
            }
            else if (element.name == 'md_marquee')
            {
                style['z-index'] = 35;
            }
            else if (element.name == 'logo')
            {
                style['z-index'] = 50;
            }
            else
            {
                style['z-index'] = element.index;
            }
        }

        function styleOrigin(element, style)
        {
            delete element.transformOrigin;

            if (element.origin)
            {
                element.origin = denormalize('pos', element.origin);
                if (element.origin.x || element.origin.y)
                {
                    element.transformOrigin = 'translate('+
                                                util.pct(-element.origin.x,'%')+','+
                                                util.pct(-element.origin.y,'%')+')';
                }
            }
            joinTransform(element, style);
        }

        function stylePos(element, style)
        {
            if (!element.pos)
            {
                delete style.left;
                delete style.top;

                if (!element.anchor_label && element.name != 'help')
                {
                    style.display = 'none';
                    return false;
                }

            }
            else
            {
                element.pos = denormalize('pos',element.pos);

                if (element.pos.x>=1 || element.pos.y>=1)
                {
                    style.display = 'none';
                    return false;
                }
                delete style.display;
                style.left = util.pct(element.pos.x,'vw');
                style.top = util.pct(element.pos.y,'vh');
            }

            return true;
        }

        function styleRatingSize(element, style)
        {
            if (element.size)
            {
                element.size = denormalize('size', element.size);
                var pct;

                // theme should only have w or h not both
                if (element.size.h)
                {
                    element.size.w = element.size.h * 5;
                    pct = 'vh';
                }
                else if (element.size.w)
                {
                    element.size.h = element.size.w / 5;
                    pct = 'vw';
                }

                if (element.size.h)
                {
                    style.height = (100 * element.size.h) + pct;
                }
                if (element.size.w)
                {
                    style.width = (100 * element.size.w) + pct;
                }
            }
        }

        function styleRatingZIndex(element, style)
        {
            if (element.zIndex)
            {
                style['z-index'] = parseInt(element.zIndex);
            }
            else if (element.name && element.name.substring(0,3)=='md_')
            {
                style['z-index'] = 30;
            }
            else
            {
                style['z-index'] = element.index;
            }
        }

        function styleRotation(element, style)
        {
            if (element.rotationOrigin)
            {
                element.rotationOrigin = denormalize('pos', element.rotationOrigin);
                style['-ms-transform-origin'] =
                style['-webkit-transform-origin'] =
                style['transform-origin'] =
                    util.pct(element.rotationOrigin.x, '%') + ' ' + util.pct(element.rotationOrigin.y, '%');
            }

            if (element.rotation)
            {
                element.transformRotation = 'rotate('+parseFloat(element.rotation)+'deg) ';
            }
            else
            {
                delete element.transformRotation;
            }
            joinTransform(element, style);
        }


        function styleSize(element, style)
        {
            if (!element.size)
            {
                delete style.width;
                delete style.height;
            }
            else
            {
                element.size = denormalize('size', element.size);

                if ((element.tag == 'textlist' || element.tag == 'text') &&
                     element.pos && element.pos.x + element.size.w > 1)
                {
                    element.size.w = 1 - element.pos.x;
                }

                if(element.size.w)
                {
                    style.width = util.pct(element.size.w, 'vw');
                }
                if(element.size.h)
                {
                    style.height = util.pct(element.size.h, 'vh');
                }
            }
        }

        function styleTextZIndex(element, style)
        {
            if (element.zIndex) // && parseInt(text.zIndex)>=0)
            {
                style['z-index'] = parseInt(element.zIndex);
            }
            else if (element.name && element.name.substring(0,3)=='md_')
            {
                style['z-index'] = 40;
            }
            else
            {
                style['z-index'] = element.index;
            }
        }

        function styleVideoMaxSize(element, style)
        {
            if (element.maxSize)
            {
                element.maxSize = denormalize('size', element.maxSize);
                if (element.maxSize.w)
                {
                    style.width =
                    style['max-width'] = util.pct(element.maxSize.w, 'vw');
                }
                if (element.maxSize.h)
                {
                    style.height =
                    style['max-height'] = util.pct(element.maxSize.h, 'vh');
                }
            }
        }

        function styleVideoZIndex(element, style)
        {
            if (config.es.VideoOmxPlayer)
            {
                style['z-index'] = 5000;
            }
            else if (element.zIndex)
            {
                style['z-index'] = parseInt(element.zIndex);
            }
            else if (element.name && element.name.substring(0,3)=='md_')
            {
                style['z-index'] = 30;
            }
            else
            {
                style['z-index'] = element.index;
            }
        }


        // calculate x changed position
        // used to insert space mid screen, move everything right (E.g extra list columns)
        // units are 0 to 1 from left to right
        function xReposition(x, insert_x, width)
        {
            // edges remain the same
            if (!x) return 0; // calc below should do the same but avoids rounding issues
            if (x==1) return 1;

            // either side of insert_x shrink by width%

            if (x <= insert_x)            // to the left
            {
                return x / ( 1 + width );
            }
            else                              // to the right
            {
                return ( x + width ) / ( 1 + width );
            }
        }

        function variableReplace(str, system_name)
        {
            if (!str || (typeof str != 'string') || !system_name || system_name == 'default')
                return str;

            var system = config.systems[system_name];
            if (!system)
            {
                return str;
            }
            str = str.replace(/\$\{system.name\}/, system.name);
            if (!str) return;
            str = str.replace(/\$\{system.fullName\}/, system.fullname);
            if (!str) return;
            return str.replace(/\$\{system.theme\}/, system.theme);
        }
    }

})();
