<?php
require_once("config.php");

$config = getConfig( SYSTEMS | APP | ENV );
$svr_dir = getcwd();

$GAME_FIELDS = array(
    'name','desc','image','rating',
    'releasedate','developer','publisher',
    'genre','players','favorite','kidgame','hidden',
    'marquee','video'
);

function get_media_path($media, $system)
{
    global $config;

    // use either config directories or roms path / images, videos or marquees
    if ($media == 'image' && isset($config['app']['uploadImageDirectory']))
    {
        return str_replace('${system_name}', $system, $config['app']['uploadImageDirectory']);
    }
    else if ($media == 'video' && isset($config['app']['uploadVideoDirectory']))
    {
        return str_replace('${system_name}', $system, $config['app']['uploadVideoDirectory']);
    }
    else if ($media == 'marquee' && isset($config['app']['uploadMarqueeDirectory']))
    {
        return str_replace('${system_name}', $system, $config['app']['uploadMarqueeDirectory']);
    }
    else
    {
        return $config['systems'][$system]['path'].'/'.$media.'s';  // E.g. .../images
    }
}

function get_media_suffix($media)
{
    global $config;

    if ($media == 'image' && isset($config['app']['uploadImageSuffix']))
    {
        return $config['app']['uploadImageSuffix'];
    }
    else if ($media == 'video' && isset($config['app']['uploadVideoSuffix']))
    {
        return $config['app']['uploadVideoSuffix'];
    }
    else if ($media == 'marquee' && isset($config['app']['uploadMarqueeSuffix']))
    {
        return $config['app']['uploadMarqueeSuffix'];
    }
    else
    {
        return '';
    }
}

function get_media_paths_full_url($filename, $system)
{
    global $svr_dir, $config;
    static $checked_dirs = [];

    $SYSTEM_URL = $config['systems'][$system]['url'];
    $url='';
    $fullpath='';
    if(substr($filename,0,2) == "./")
    {
        $url = $SYSTEM_URL.'/'.substr($filename,2);
    }
    elseif (substr($filename,0,2) == "~/")
    {
        $fullpath = HOME.'/'.substr($filename,2);
    }
    elseif (substr($filename,0,1) != "/")
    {
        $url = $SYSTEM_URL.'/'.$filename;
    }
    else
    {
        $fullpath = $filename;
    }

    if ($fullpath)
    {
        $fullpath = str_replace('/./','/',$fullpath);

        if (substr($fullpath, 0, 45) === '/home/pi/.emulationstation/downloaded_images/')
        {
            $url = substr($fullpath, 27);
        }
        else if (substr($fullpath, 0, $l=strlen(ROMBASE)) === ROMBASE)
        {
            $url = substr($fullpath, $l+1);
            $dir = pathinfo($url, PATHINFO_DIRNAME);
            if (!isset($checked_dirs) && !file_exists($dir))
            {
                $p = strpos($url, '/'.$system.'/');
                if ($p !== false)
                {
                    $url_dir = $svr_dir.'/'.substr($url, 0, $p);
                    if (!file_exists($url_dir))
                    {
                        $full_dir = substr($fullpath, 0, $p+$l);
                        // pull media directory to under our web root
                        //$ret = symlink($full_dir, $url_dir);
                        exec("ln -s $full_dir $url_dir");
                    }
                }
                $checked_dirs[$dir] = true;
            }
        }
        elseif (substr($fullpath, 0, $l=strlen(HOME)) === HOME)
        {
            $url = 'home_'.substr($fullpath, $l+1);
            $dir = pathinfo($url, PATHINFO_DIRNAME);
            if (!isset($checked_dirs) && !file_exists($dir))
            {
                $p = strpos($url, '/'.$system.'/');
                if ($p !== false)
                {
                    $url_dir = $svr_dir.'/'.substr($url, 0, $p);
                    if (!file_exists($url_dir))
                    {
                        $full_dir = substr($fullpath, 0, $p+$l-5);
                        // pull media directory to under our web root
                        //$ret = symlink($full_dir, $url_dir);
                        exec("ln -s $full_dir $url_dir");
                    }
                }
                $checked_dirs[$dir] = true;
            }
        }
    }
    else
    {
        $fullpath = $svr_dir.'/'.$url;
    }

    if (file_exists($fullpath))
    {
        if(!isset($dir))
            $dir = pathinfo($url, PATHINFO_DIRNAME);
        $url =  $dir.'/'
                .rawurlencode(pathinfo($url, PATHINFO_BASENAME))
                .'?'.filemtime($fullpath);
    }

    return array('fullpath' => $fullpath, 'url' => $url);
}


function human_filesize($bytes, $decimals = 1)
{
    $sz = 'BKMGTP';
    $factor = floor((strlen($bytes) - 1) / 3);
    return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}


function resize_media($source_filename, $destination_filename, $maxwidth, $maxheight)
{
    // uploaded image size
    list($width, $height, $type, $attr) = getimagesize($source_filename);

    if ($width && $height)
    {
        if ($width > $maxwidth || $height > $maxheight)
        {
            $ratio = $width / $height;
            // resize to height or width
            if ($maxwidth / $maxheight > $ratio)
            {
                $newwidth = $maxheight * $ratio;
                $newheight = $maxheight;
            }
            else
            {
                $newheight = $maxwidth / $ratio;
                $newwidth = $maxwidth;
            }

            // read the uploaded image
            switch ($type)
            {
                case IMAGETYPE_JPEG:  $src_img = imagecreatefromjpeg($source_filename); break;
                case IMAGETYPE_GIF:   $src_img = imagecreatefromgif($source_filename);  break;
                case IMAGETYPE_PNG:   $src_img = imagecreatefrompng($source_filename);  break;
            }

            if (isset($src_img) && $src_img)
            {
                $dst_img = imagecreatetruecolor($newwidth, $newheight);
                // Prevserve transparency : Credit http://www.nimrodstech.com/php-image-resize/
                if ( $type == IMAGETYPE_GIF || $type == IMAGETYPE_PNG )
                {
                    $transparency = imagecolortransparent($src_img);
                    $palletsize = imagecolorstotal($src_img);

                    if ($transparency >= 0 && $transparency < $palletsize)
                    {
                        $transparent_color  = imagecolorsforindex($src_img, $transparency);
                        $transparency       = imagecolorallocate($dst_img, $transparent_color['red'], $transparent_color['green'], $transparent_color['blue']);
                        imagefill($dst_img, 0, 0, $transparency);
                        imagecolortransparent($dst_img, $transparency);
                    }
                    elseif ($type == IMAGETYPE_PNG)
                    {
                        imagealphablending($dst_img, false);
                        $color = imagecolorallocatealpha($dst_img, 0, 0, 0, 127);
                        imagefill($dst_img, 0, 0, $color);
                        imagesavealpha($dst_img, true);
                    }
                }

                imagecopyresampled($dst_img, $src_img, 0, 0, 0, 0, $newwidth, $newheight, $width, $height);

                // Write resized image to media directory
                switch ( $type )
                {
                    case IMAGETYPE_GIF:  return imagegif($dst_img, $destination_filename);
                    case IMAGETYPE_JPEG: return imagejpeg($dst_img, $destination_filename, 100);
                    case IMAGETYPE_PNG:  return imagepng($dst_img, $destination_filename, 0);
                }
            }
        }
    }
}

?>
