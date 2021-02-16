<?php
$session = session_start();

require_once("xml_util.php");
require_once("vars.php");
include_once("local.php");

define("APP", 1);
define("ENV", 2);
define("LANG", 4);
define("ES", 8);
define("THEMES", 16);
define("SYSTEMS", 32);
define("THEMES_LIST", 64);

// For multiple users (especially WAN users)
// hold user preference fields below as session variables
$USER_PREFERENCE_SETTINGS = array(
    'ThemeSet','Language','DateFormat',
    'ViewTransitions','ViewStyle',
    'ShowEmptySystems','ShowEmptyDirectories','OrderSystemsByFullname',
    'ShowAddFields','ShowGameCounts',
    'ShowThemeSelect','ShowViewSelect',
    'LogSystemTotals','WaitForAnimations',
    'AutoplayVideos','MuteVideos','ShowVideoControls',
    'ShowHomeMenu','ShowESControl','ShowLaunch'
);

function getConfig($get)
{
    global $session, $USER_PREFERENCE_SETTINGS;

    $local = getLocal();

    $config = array('edit' => false, 'local' => $local);

    if ($get & APP)
    {
        if (file_exists(HOME.'/.webtropie/settings.cfg'))
        {
            $config['app'] = load_file_xml_as_array(HOME.'/.webtropie/settings.cfg', true);
            $defaults      = load_file_xml_as_array('../config/settings.cfg', true);
            // fill missing settings with defaults
            foreach ($defaults as $setting => $value)
            {
                if(!isset($config['app'][$setting]))
                    $config['app'][$setting] = $value;
            }
        }
        else
        {
            $config['app'] = load_file_xml_as_array('../config/settings.cfg', true);
        }

        // For WAN users read preferences from session vars if set
        if ($session)
        {
            foreach ($USER_PREFERENCE_SETTINGS as $setting)
            {
                if (isset($_SESSION[$setting]))
                {
                    $config['app'][$setting] = $_SESSION[$setting];
                }
            }
        }

        // wide area network allowed to edit
        if (isset($config['app']['WanEditMode']) && $config['app']['WanEditMode'])
        {
            $config['edit'] = true;
        }

        if (!$local)
        {
            $config['app']['LoadAllSystems'] = false;
        }
    }

    if ($get & ENV)
    {
        $config['env'] = array();
        $config['env']['has_gd'] = extension_loaded('gd') ? 1 : 0;
        $config['env']['es_pid'] = exec('pgrep -xf "./emulationstation"');
        if ($local)
        {
            $config['env']['has_launch'] = file_exists("runcommand.sh") ? 1 : 0;
            $config['edit'] = true;
        }
    }

    if ($get & LANG)
    {
        if (isset($_GET['lang']))
            $lang = $_GET['lang'];
        else
            $lang = $config['app']['Language'];

        if (!$lang || !file_exists('../config/lang-'.$lang.'.cfg'))
            $lang='en';

        $config['lang'] = load_file_xml_as_array('../config/lang-'.$lang.'.cfg', true);
    }

    if ($get & ES)
    {
        $config['es'] = load_file_xml_as_array(ES_CONFIG."/es_settings.cfg", true);
    }

    if ($get & THEMES)
    {
        if (file_exists(HOME.'/.webtropie/themes.cfg'))
        {
            $config['themes'] = load_file_xml_as_array(HOME.'/.webtropie/themes.cfg', true);
            $defaults         = load_file_xml_as_array('../config/themes.cfg', true);
            // fill missing settings with defaults
            foreach ($defaults as $setting => $value)
            {
                if(!isset($config['themes'][$setting]))
                    $config['themes'][$setting] = $value;
            }
        }
        else
        {
            $config['themes'] = load_file_xml_as_array('../config/themes.cfg', true);
        }    
    }

    if ($get & SYSTEMS)
    {
        $config['systems'] = array();

        if (file_exists($file = HOME."/.emulationstation/es_systems.cfg") ||
            file_exists($file = ETC_ES."/es_systems.cfg"))
        {
            $systems = load_file_xml_as_array($file, false, false, ['system'=>true]);

            foreach($systems['system'] as &$system)
            {
                $system['path'] = str_replace('\\', '/', $system['path']);
                $system['path'] = str_replace('~', HOME, $system['path']);

                $system['url'] = str_replace(ROMBASE.'/','', $system['path']);
                /* TODO rom path is not under web root
                if (!file_exists($system['url']))
                {
                    mklink full -> url
                }
                */
                if (file_exists($system['path']))
                {
                    $system['has_system'] = true;
                    if (file_exists($file = $system['path']."/gamelist.xml") ||
                        file_exists($file = ES_CONFIG.'/gamelists/'.$system['name']."/gamelist.xml"))
                    {
                        $system['has_gamelist'] = true;
                        $system['gamelist_mtime'] = filemtime($file);
                        $system['gamelist_file'] = $file;
                        if (filesize($file) > 40)
                        {
                            $system['has_games'] = true;
                        }
                    }
                    else
                    {
                        $system['has_gamelist'] = false;
                        $system['gamelist_file'] = $system['path']."/gamelist.xml";
                    }
                }
                $config['systems'][$system['name']] = $system;
            }
        }
    }

    // also get a list of names of other available themes
    if ($get & THEMES_LIST)
    {
        $config['themes_list'] = array();
        // list all directories in the 'themes' directory
        if($dh = opendir("themes"))
        {
            while(($theme = readdir($dh)) !== false)
                if($theme != '.' && $theme != '..' && is_dir("themes/".$theme))
                    array_push($config['themes_list'], array( 'name' => $theme));
            closedir($dh);
        }
    }

    return $config;
}

?>
