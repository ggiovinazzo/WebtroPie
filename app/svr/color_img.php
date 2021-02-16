<?php
require_once("cache.php");

$file = isset($_GET['file']) ? $_GET['file'] : '';
$color = isset($_GET['color']) ? $_GET['color'] : 'ffffff';
$mult = isset($_GET['mult']) ? $_GET['mult'] : false;

// sanitize filename remove ./ ../ etc
$file = preg_replace('|\.*\.[\\/]|', '', $file);

$color = strtoupper( $color );

// convert hex color to object r,g,b,a
function hex2rgba($color) {

   if($color[0] == '#')
      $color = substr( $color, 1 );

   return (object) array('r' => hexdec(substr($color,0,2)),
                         'g' => hexdec(substr($color,2,2)),
                         'b' => hexdec(substr($color,4,2)),
                         'a' => hexdec(substr($color.'FF',6,2)));
}

$rgba = hex2rgba($color);

if(!file_exists($file)) {
   print "file $file does not exist\n";
   exit;
}

caching_headers($file.$color, filemtime($file));

list($basename, $extension) = preg_split('/\./',$file);

$extension = strtolower( $extension );

if( $extension == 'svg' ) {

   header('Content-Type: image/svg+xml');
   $fp = fopen($file,'r') or die("Unable to open file!");
   while(!feof($fp)) {
      $line = fgets($fp);
      if($rgba->a == 255) {
         $opacity=true;
      }
      else {
         $opacity=false;
         if(preg_match('/(.*<(path|polygon|ellipse|circle|rect).*opacity=[\"\'])([^\"\']*)(.*)/i', $line, $matches) && count($matches)==5) {
            if($mult) {
               $old_a = $matches[3];
               $a = $old_a*$rgba->a/255;
            }
            else {
               $a = $rgba->a/255;
            }
            $line = $matches[1].$a.$matches[4]."\n";
            $opacity=true;
         }
         elseif(preg_match('/(.*style=[\"\'].*;opacity:)([^;]*)(.*)/i', $line, $matches) && count($matches)==4) {
            if($mult) {
               $old_a = $matches[2];
               $a = $old_a*$rgba->a/255;
            }
            else {
               $a = $rgba->a/255;
            }
            $line = $matches[1].$a.$matches[3]."\n";
            $opacity=true;
         }
      }
      if(preg_match('/(.*<(path|polygon|ellipse|circle|rect).*fill=[\"\'])([^\"\']*)(.*)/i', $line, $matches) && count($matches)==5) {
         if($mult) {
            $old_rgb = hex2rgba($matches[3]);
            $r = ($old_rgb->r/255)*($rgba->r/255); //*($rgba->a);
            $g = ($old_rgb->g/255)*($rgba->g/255); //*($rgba->a);
            $b = ($old_rgb->b/255)*($rgba->b/255); //*($rgba->a);
         }
         else {
            $r = $rgba->r;
            $g = $rgba->g;
            $b = $rgba->b;
         }
         $color = sprintf("#%02x%02x%02x", $r, $g, $b);
         if($opacity)
            echo $matches[1].$color.$matches[4]."\n";
         else
            echo $matches[1].$color."\" opacity=\"".($rgba->a/255).$matches[4]."\n";
      }
      elseif(preg_match('/(.*style=[\"\'].*;fill:)([^;]*)(.*)/i', $line, $matches) && count($matches)==4) {
         if($mult) {
            $old_rgb = hex2rgba($matches[2]);
            $r = ($old_rgb->r/255)*($rgba->r/255); //*($rgba->a);
            $g = ($old_rgb->g/255)*($rgba->g/255); //*($rgba->a);
            $b = ($old_rgb->b/255)*($rgba->b/255); //*($rgba->a);
         }
         else {
            $r = $rgba->r;
            $g = $rgba->g;
            $b = $rgba->b;
         }
         $color = sprintf("#%02x%02x%02x", $r, $g, $b);
         echo $matches[1].$color.$matches[3]."\n";
      }
      else
         echo $line;
   }
   fclose($fp);
   exit;
}

if (!extension_loaded('gd') || !function_exists('gd_info')) {
   echo "PHP GD library is NOT installed on your web server";
   exit;
}

$im = false;

if ( $extension == 'png') {
   $im = imagecreatefrompng($file);
}
elseif ( $extension == 'jpg') {
   $im = imagecreatefromjpeg($file);
}
elseif ( $extension == 'gif') {
   $im = imagecreatefromgif($file);
}

// blend image
if($im) {
   imagesavealpha($im, true);
   imagealphablending($im, false);

   $inv = (object) array('r' => 255 - $rgba->r,
                         'g' => 255 - $rgba->g,
                         'b' => 255 - $rgba->b,
                         'a' => (255 - $rgba->a)/2);

   imagefilter($im, IMG_FILTER_NEGATE);
   imagefilter($im, IMG_FILTER_COLORIZE, $inv->r, $inv->g, $inv->b, $inv->a);
   imagefilter($im, IMG_FILTER_NEGATE);

   if( $extension == 'png') {
      header('Content-Type: image/png');
      imagepng($im);
   }
   elseif( $extension == 'jpg') {
      header('Content-Type: image/jpeg');
      imagejpeg($im);
   }
   elseif( $extension == 'gif') {
      header('Content-Type: image/gif');
      imagegif($im);
   }
   imagedestroy($im);
}

?>
