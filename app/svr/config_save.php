<?php
require_once("config.php");

$config = getConfig( APP | ENV );
$response = array('changed'=>false);

// Is it a user preference setting? yes, then save in session
// (multiple LAN or WAN users may have difference preferences)
if (array_search($_POST['setting'], $USER_PREFERENCE_SETTINGS) !== FALSE)
{
    $_SESSION[$_POST['setting']] = $_POST['value']=='false' ? false : $_POST['value'];
    $response['session_'.$_POST['setting']] = $_POST['value'];
}

// If client is local then also save as setting on pi (most cases)
if ($config['local'] && isset($_POST['file']))
{
    if ($_POST['file'] & APP)
    {
        $file = HOME.'/.webtropie/settings.cfg';
    }
    elseif ($_POST['file']  & THEMES)
    {
        $file = HOME.'/.webtropie/themes.cfg';
    }

    $exists = false;

    if (file_exists($file))
    {
        $xml = simplexml_load_file_wrapped($file);
        foreach ($xml->children() as $type => $xmlchild)
        {
            if ( (string) $xmlchild['name'] == $_POST['setting'] )
            {
                $exists = true;
                // update
                if ( (string) $xmlchild['value'] != $_POST['value'] )
                {
                    $xmlchild['value'] = $_POST['value'];
                    $response['changed'] = true;
                }
                break;
            }
        }
    }
    else
    {
        if (!file_exists(HOME.'/.webtropie'))
            mkdir(HOME.'/.webtropie', 0775);

        $xml = new SimpleXMLElement("<wrapped></wrapped>");
    }

   // insert
   if (!$exists)
   {
      //$child = $xml->addChild($_POST['setting'], $_POST['value']);
      $child = $xml->addChild($_POST['type']);
      $child->addAttribute('name', $_POST['setting']);
      $child->addAttribute('value', $_POST['value']);
      $response['changed'] = true;
   }
   // success: save
   // failed: postback for debugging
   if ($response['changed'])
   {
      simplexml_save_file_unwrapped($xml, $file);
   }
   else
   {
      $response['post'] = $_POST;
   }
}

echo json_encode($response);
?>
