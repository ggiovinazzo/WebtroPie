<?php
// allow client cache
function caching_headers ($file, $timestamp) {
    $gmt_mtime = gmdate('r', $timestamp);
    $seconds_to_cache = 7 * 24 * 60 * 60; // cache for 1 week
    $ts = gmdate("D, d M Y H:i:s", time() + $seconds_to_cache) . " GMT";
    header('ETag: "'.md5($timestamp.$file).'"');
    header('Last-Modified: '.$gmt_mtime);
    header('Cache-Control: public');
    header("Expires: $ts");
    header("Pragma: cache");
    header("Cache-Control: cache,max-age=$seconds_to_cache");

    if(isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) || isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
        if ($_SERVER['HTTP_IF_MODIFIED_SINCE'] == $gmt_mtime || str_replace('"', '', stripslashes($_SERVER['HTTP_IF_NONE_MATCH'])) == md5($timestamp.$file)) {
            header('HTTP/1.1 304 Not Modified');
            exit();
        }
    }
}
?>
