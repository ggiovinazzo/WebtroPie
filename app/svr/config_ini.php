<?php
require_once("config.php");

if (isset($_GET['get']))
{
   echo json_encode(getConfig($_GET['get']));
}
else
{
   echo json_encode(getConfig(255));
}
?>
