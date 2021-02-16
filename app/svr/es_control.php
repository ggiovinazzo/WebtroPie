<?php
// -----------------------------
// Start / Stop EmulationStation
ini_set('max_execution_time', 60);
    
require_once("vars.php");
include_once("local.php");

$local = getLocal();
$response = array();

// initial es_pid
$es_pid = exec('pgrep -xf ".*emulationstation"');

// start up
if ($local && isset($_GET['start']) && !$es_pid )
{
    $response['started'] = true;
    $response['success'] = exec('export HOME='.HOME.'
/opt/retropie/supplementary/emulationstation/emulationstation.sh');
}
// shutdown nicely
elseif ($local && isset($_GET['stop']))
{
    $response['stopped'] = true;
    exec("kill ".$es_pid);

    // wait for death!
    for($i=0; $es_pid && $i<50; $i++)
    {
        sleep(1);
        $es_pid = exec('pgrep -xf ".*emulationstation"');
    }
}
elseif (isset($_GET['status']))
{
    // new es_pid
    $response['es_pid'] = exec('pgrep -xf ".*emulationstation"');
}

echo json_encode($response);
?>
