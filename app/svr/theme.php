<?php
require_once("cache.php");
require("config.php");

$theme  = isset($_GET['theme']) ? $_GET['theme'] : false;

if ($theme)
{
    $config = getConfig( SYSTEMS | ES );
}
else
{
    $config = getConfig( SYSTEMS | ES | APP | ENV );

    $theme = $config['app']['ThemeSet'] ||
             $config['es']['ThemeSet'] ||
             DEFAULT_THEME;
}

$themepath = "themes/".$theme;

// cache theme last updated to last git pull or this file last changed
if(file_exists($themepath.'/.git/FETCH_HEAD'))
{
    caching_headers($themepath, max(filemtime('theme.php'),filemtime($themepath.'/.git/FETCH_HEAD')));
}

$response = array();
$response['name'] = $theme;
$response['path'] = 'svr/'.$themepath;
$response['has_gd'] = extension_loaded('gd') ? 1 : 0;

// load file and recursively includes within included files
$response['includes'] = array();

$response['fonts'] = array();


function get_font(&$text, $path)
{
    global $response, $themepath;

    if(!isset($text['fontPath']))
        return;

    $fullpath = simplify_path($themepath.'/'.$path.'/'.$text['fontPath']);

    if(!file_exists($fullpath)) {
        return;
    }
    $family = substr($fullpath,7, strlen($fullpath)-11);
    $family = str_replace(array('-','/'),'_',$family);
    $text['fontFamily'] = $family;
    unset($text['fontPath']);

    if(!isset($response['fonts'][$family]))
    {
        $vcenter = -50;
        // get baseline, '.' should always be on baseline
        $dims = @imagettfbbox(1000, 0, $fullpath, '.');
        if ($dims)
        {
            $baseline = $dims[1];
            // upper/lower + left/right
            $dims = imagettfbbox(1000, 0, $fullpath, "MASTERyjgpq");
            $height = $dims[1] - $dims[7];
            if ($height)
                $vcenter = -50 -(40 * $baseline / $height);
        }

        $response['fonts'][$family] = array(
            'fullpath' => 'svr/'.$fullpath,
            'family' => $family,
            'vcenter' => $vcenter
        );
   }
}

function get_views_fonts(&$views, $path)
{
    if($views)
    foreach ($views as &$view)
    {
        if (isset($view['text']))
        {
            foreach ($view['text'] as &$el)       get_font($el, $path);
        }
        if (isset($view['textlist']))
        {
            foreach ($view['textlist'] as &$el)   get_font($el, $path);
        }
        if (isset($view['datetime']))
        {
            foreach ($view['datetime'] as &$el)   get_font($el, $path);
        }
        if (isset($view['helpsystem']))
        {
            foreach ($view['helpsystem'] as &$el) get_font($el, $path);
        }
    }

}

function load_and_include($file, &$parent=null, $index=-1)
{
    global $response, $themepath;

    $incfile = simplify_path($file);

    if($parent!=null && $index!=-1) {
        // copy modified reference back to parent
        $parent['include'][$index] = $incfile;
        // if already included return
        if (isset($response['includes'][$incfile]))
            return;
    }

    // already included
    if(isset($response['includes'][$incfile]))
    {
        return;
    }

    $path = pathinfo($incfile, PATHINFO_DIRNAME );

    // the files that will be returned as an array
    $arr = load_file_xml_as_array($themepath.'/'.$incfile, false, true, ['include'=>1, 'feature'=>1], ['image'=>1, 'video'=>1, 'rating'=>1, 'view'=>1]);

    if(isset($arr['error']))
    {
        return $arr;
    }

    get_views_fonts($arr['view'], $path);
    if (isset($arr['feature']))
    {
        foreach ($arr['feature'] as &$feature)
        {
            get_views_fonts($feature['view'], $path);
        }
    }

    // store include file in response
    if($index!=-1)
    {
        $response['includes'][$incfile] = &$arr;
    }

    // include includes recursively
    if (isset($arr['include']))
    {
        foreach ($arr['include'] as $index => $incfile)
        {
            load_and_include($path.'/'.$incfile, $arr, $index);
        }
    }

    return $arr;
}
// array of 'systems', get theme for each system/platform
// where roms/system/gamelist.xml exists
$response['systems'] = array();

// default theme
if (file_exists($themepath.'/theme.xml'))
{
    $response['systems']['default'] =
        array('name' => 'default',
                'path' => 'svr/'.$themepath,
                'theme' => load_and_include('theme.xml'));
}
// (usable - having roms) system themes
foreach ($config['systems'] as $system_name => $system)
{
    if (file_exists($system['path']))
    {
        if (file_exists($themepath.'/'.$system['theme'].'/theme.xml'))
        {
            $response['systems'][$system['theme']] =
                array(
                    'name' => $system['theme'],
                    'path' => 'svr/'.$themepath.'/'.$system['theme'],
                    'theme' => load_and_include($system['theme'].'/theme.xml')
            );
        }
        elseif (file_exists($themepath.'/'.$system['name'].'/theme.xml'))
        {
            $response['systems'][$system['name']] =
                array(
                    'name' => $system['name'],
                    'path' => 'svr/'.$themepath.'/'.$system['name'],
                    'theme' => load_and_include($system['name'].'/theme.xml')
            );
        }
    }
}

// collections
foreach (array('auto-allgames','auto-favorites','auto-lastplayed','custom-collections','retropie'
) as $system)
{
    if (file_exists($themepath.'/'.$system.'/theme.xml'))
    {
        $response['systems'][$system] =
            array('name' => $system,
                    'path' => 'svr/'.$themepath.'/'.$system,
                    'theme' => load_and_include($system.'/theme.xml'));
    }
}

// custom collections that match systems
if($config['es']['CollectionSystemsCustom'])
foreach (preg_split('/,/', $config['es']['CollectionSystemsCustom']) as $system)
{
    if (file_exists($themepath.'/'.$system.'/theme.xml'))
    {
        $response['systems'][$system] =
            array('name' => $system,
                    'path' => 'svr/'.$themepath.'/'.$system,
                    'theme' => load_and_include($system.'/theme.xml'));
    }
}


// return converted array to json
echo json_encode($response);
?>
