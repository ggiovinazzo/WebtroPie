<?php

function getLocal()
{
    global $_SERVER;

    if (!isset($_SERVER['REMOTE_ADDR']))
    {
        return true;
    }
    $client = ip2long($_SERVER['REMOTE_ADDR']);

    return (($client >= ip2long('192.168.0.0') && $client <= ip2long('192.168.255.255')) ||
            ($client >= ip2long('172.16.0.0') && $client <= ip2long('172.31.255.255')) ||
            ($client >= ip2long('10.0.0.0') && $client <= ip2long('10.255.255.255'))) ? 1 : 0;
}

?>
