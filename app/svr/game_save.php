<?php
require_once("game.php");

if (!$config['edit'])
{
    exit;
}

$gamelist_file = $config['systems'][$_POST['system']]['gamelist_file'];

$response = array('success'=>false);

$gamelist = simplexml_load_file($gamelist_file);

// start search from where it was last in the gamelist
function findGame(&$gamelist, &$post)
{
    global $response;

    $index = (int)$post['index'];  // its last index

    // usually, for a single user, the first test will find the game

    // search 10 back (games above have been deleted?)
    for ($i=$index; $i>$index-10; $i--)
    {
        $game = &$gamelist->game[$i];
        if ($game->path == $post['game_path'])
        {
            $game->index = $i;
            return $game;
        }
    }

    // search forward 10 (games inserted above?)
    for ($i=$index+1; $i < $index+10 && $i<count($gamelist->game); $i++)
    {
        $game = &$gamelist->game[$i];
        if ($game->path == $post['game_path'])
        {
            $game->index = $i;
            return $game;
        }
    }

    // search -10 to 0 above
    for ($i=$index-10; $i>=0; $i--)
    {
        $game = &$gamelist->game[$i];
        if ($game->path == $post['game_path'])
        {
            $game->index = $i;
            return $game;
        }
    }

    // search +10 to end below
    for ($i=$index+10; $i<count($gamelist->game); $i++)
    {
        $game = &$gamelist->game[$i];
        if ($game->path == $post['game_path'])
        {
            $game->index = $i;
            return $game;
        }
    }

    return false;
}

function insertGame(&$gamelist, &$post)
{
    global $GAME_FIELDS;

    $game = $gamelist->addChild('game');
    $game->addChild('path', $post['game_path']);
    foreach ($GAME_FIELDS as $field)
    {
        if ($post[$field])
        {
            if ($field == 'favorite' || $field == 'kidgame' || $field == 'hidden')
            {
                $game->addChild($field, 'true');
            }
            else
            {
                $game->addChild($field, $post[$field]);
            }
        }
    }
}

function updateGame(&$game, &$post)
{
    global $GAME_FIELDS;

    // for all meta data posted...
    foreach ($GAME_FIELDS as $field)
    {
        // get the value
        if (isset($post[$field]))
        {
            $value = $post[$field];
            if ($field == 'favorite' || $field == 'kidgame' || $field == 'hidden')
            {
                if ($value == 1 || $value == 'true')
                {
                    // add true
                    if (isset($game->$field))
                    {
                        $game->$field = 'true';
                    }
                    else
                    {
                        $game->addChild($field, 'true');
                    }
                }
                else if($game->$field)
                {
                    unset($game->$field);  // remove
                }
            }
            else
            {
                // then update the xml
                if (isset($game->$field))
                    $game->$field = $value;
                else
                    $game->addChild($field, $value);
            }
        }
    }
}

if ($_POST['insert'])
{
    insertGame($gamelist, $_POST);
    $response['success'] = true;
    $response['index'] = count($gamelist->game);
}
elseif ($_POST['update'])
{
    $game = findGame($gamelist, $_POST);
    if ($game)
    {
        updateGame($game, $_POST);
        $response['index'] = $game->index;
        $response['success'] = true;
        unset($game->index);
    }
}
elseif ($_POST['delete'])
{
    if (isset($_POST['index'])) // existing game
    {
        $game = findGame($gamelist, $_POST);
        if ($game)
        {
            unset($game[0]);
            $response['success'] = true;
        }
    }
    if (isset($_POST['rom']) && $_POST['rom']=='true')
    {
        chdir($config['systems'][$_POST['system']]['path']);
        if(file_exists($_POST['game_path']))
        {
            unlink($_POST['game_path']);
            $response['success'] = true;
        }
    }
}

// Something changed
if ($response['success'])
{
    // fast but unformatted
    //$gamelist->asXml($gamelist_file);

    // slower nice whitespace :-
    $dom = new DOMDocument('1.0');
    $dom->preserveWhiteSpace = false;
    $dom->formatOutput = true;
    $dom->loadXML($gamelist->asXML());
    $dom->save($gamelist_file);

    /* TODO:

    if ($_POST['delete_image'])
    ...
    if ($_POST['delete_marquee'])
    ...
    */
}

echo json_encode($response);
?>
