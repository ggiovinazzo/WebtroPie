<?php
ini_set('max_execution_time', 300);

require_once("cache.php");
require_once("game.php");

$system      = isset($_GET['system'])      ? $_GET['system']      : false;
$scan        = isset($_GET['scan'])        ? $_GET['scan']        : false;
$match_media = isset($_GET['match_media']) ? $_GET['match_media'] : false;
$extensions  = isset($config['systems'][$system]['extension'])
                ? '*{'.str_replace(' ',',',$config['systems'][$system]['extension']).'}'
                : false;

if (!$system) exit;
if (!$config['edit'])
{
    $scan = false;
    $match_media = false;
}

if (substr($system,0,7)=='custom-')
{
    $response = [];
    chdir(ES_CONFIG."/collections");
    $gamelist_file = $system.'.cfg';
    $cwd = getcwd();
    if (file_exists($gamelist_file))
    {
        $response['game'] = file($gamelist_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        // Each line is a game path
        foreach ($response['game'] as $index => &$game)
        {
            $game = str_replace('//','/', $game);
            //$game = str_replace(HOME,'~', $game);
            // find which system it belongs to
            foreach ($config['systems'] as $system_name => &$system)
            {
                $sp = strpos($game, $system['path']);
                if ($sp !== FALSE)
                {
                    $game =(object) array(
                        'system' => $system_name,
                        'path' => substr($game, 1 + $sp + strlen($system['path']))
                    );
                    break;
                }
            }
        }
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}
else
{
    $gamelist_file = $config['systems'][$system]['gamelist_file'];
}

if(!$scan && !$match_media)
{
    $mtime = max(filemtime('game_list.php'),
                 filemtime('game.php'),
                 $config['systems'][$system]['has_gamelist'] ? filemtime($gamelist_file) : 0);

    caching_headers($gamelist_file, $mtime);

    $gamelist_cache = preg_replace('/\.xml/', '.cache', $gamelist_file);

    if(file_exists($gamelist_cache) && filemtime($gamelist_cache) > $mtime)
    {
       echo file_get_contents($gamelist_cache);
       exit;
    }
}

// scan for new files in the directory specified
function scan_dir($subdir='')
{
    global $response, $games, $extensions, $SYSTEM_PATH, $svr_dir;

    $path = '';
    if ($subdir)
    {
        $path = $subdir.'/';
    }

    // scan for files with matching extensions
    foreach( glob($path.$extensions, GLOB_BRACE) as $filename)
    {
        $shortpath = simplify_path($filename, $SYSTEM_PATH.'/');

        // already in gamelist.xml?
        if (!isset($games[strtolower($shortpath)]))
        {
            array_push($response['game'],
                array(
                    'name' => pathinfo($filename, PATHINFO_FILENAME),
                    'path' => './'.$filename,
                    'shortpath' => $shortpath,
                    'size' => filesize($filename),
                    'human_size' => human_filesize($size),
                    'mtime' => filemtime($filename),
                    'new'  => 1  // flag as a new rom
                ));
        }
    }

    // scan for subdirectories
    foreach(glob($path.'*', GLOB_ONLYDIR) as $filename)
    {
        // already in gamelist.xml?
        if (!isset($games[strtolower($filename)]))
        {
            array_push($response['game'],
                array(
                    'name' => substr($filename,strlen($path)),
                    'path' => $filename,
                    'isDir'  => 1,
                    'new'  => 1  // flag as a new directory
                ));
        }

        // recurse into directory
        scan_dir($path.$filename);
    }
}

function check_media(&$game, $media, $ext)
{
    global $response, $match_media, $system, $svr_dir;

    if (!isset($game[$media]) && $match_media)
    {
        $rom = pathinfo($game['path'], PATHINFO_FILENAME);
        $mediafile = get_media_path($media, $system).'/'.$rom.'.'.$ext;
        if (file_exists($mediafile))
        {
            $game[$media] = $mediafile;
            $game[$media.'_found'] = 1;
        }
    }

    if (isset($game[$media]))
    {
        $response['has_'.$media] = true;

        $media_paths = get_media_paths_full_url($game[$media], $system, true);
        if (file_exists($media_paths['fullpath']))
        {
            if ($media_paths['url'])
            {
                $game[$media.'_url'] = $media_paths['url'];
            }
        }
    }
}

// -------------------
// GET A FULL GAMELIST

$SYSTEM_PATH = $config['systems'][$system]['path'];

chdir($SYSTEM_PATH);

$response['name'] = $system;
$response['path'] = 'svr/'.$config['systems'][$system]['url'];
$response['has_image'] = false;
$response['has_video'] = false;
$response['has_marquee'] = false;

if ($config['systems'][$system]['has_gamelist'])
{
    $response = load_file_xml_as_array($config['systems'][$system]['gamelist_file'], false, false, ['game'=>true], ['game'=>1]);

    if (isset($response['game']))
    foreach ($response['game'] as $index => &$game)
    {
        $game['shortpath'] = simplify_path($game['path'], HOME.'/RetroPie/'.$SYSTEM_PATH.'/');

        if (file_exists($game['path']))
        {
            $size = filesize($game['path']);
            $game['size'] = $size;
            $game['mtime'] = filemtime($game['path']);
        }
        else
        {
            $game['size'] = -1;
        }

        if (isset($game['lastplayed']))
        {
            $game['lptime'] = strtotime($game['lastplayed']);
            unset($game['lastplayed']);
        }

        if ($scan)
        {
            $games[strtolower($game['shortpath'])] = 1;
        }

        check_media($game, 'image',   'png');
        check_media($game, 'marquee', 'png');
        check_media($game, 'video',   'mp4');
    }
}
else
{
    $response = ['game'=>[]];
}

if ($scan && $extensions)
{
    scan_dir();
}

if(!$scan && !$match_media &&
   $config['app']['CacheGamelists'])
{
    chdir($svr_dir);
    file_put_contents($gamelist_cache, json_encode($response, JSON_UNESCAPED_UNICODE));
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>
