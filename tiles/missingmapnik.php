<?php
/************************************************************************
 *
 * On demand tile rendering proxy (c) 2007-2010 by Daniel Schwen
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or (at
 * your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA.
 *
 ************************************************************************/

//error_reporting(E_ALL);
//ini_set('display_errors', 1);

$base = "/tiles/mapnik/";
$url = $_SERVER["REQUEST_URI"]; // apache

// zeus web server
/*if( $_GET['coord'] )
{
  list($type, $z, $y, $y2, $x ) = explode("_", $_GET['coord'] );
  if( $type == 'mapnik' )
    $url = $base . $z . '/' . $y. '/tile_' . $y2 . '_' . $x . '.png';  
  if( $type == 'sat' )
    $url = $base . 'sat/' . $z . '/' . $y. '/' . $y2 . '_' . $x . '.png';  
}*/

//echo filemtime('cut');

//exit; // DB server under maintenance

//
// is the requested URL pointing to a tile set dir?
//
if( substr($url,0,strlen($base)) == $base )
{
  //
  // is the tile filename format correct?
  //
  if( preg_match('{^([0-9]+)\/([0-9]+)\/tile_([0-9]+)_([0-9]+)\.png}',substr($url,strlen($base)), $matches) )
  {
   $z = intval($matches[1]);
   $y = intval($matches[2]);
   $y2 = intval($matches[3]);
   $x = intval($matches[4]);

   $mx = 3 * ( 2 << $z );
   $my = $mx/2;

   //
   // was a legal tile number requested?
   //
   if( $z>=8 && $y>=0 && $x>=0 && $x<$mx && $y<$my && $y == $y2 ) 
   {
    $tfile = "mapnik/$z/$y/tile_" . $y . "_" . $x . ".png";
    umask( 0033 );
   
    $requested = false;
    $pid = file_get_contents( "/tmp/wikiminiatlas.tile" . $z . ".pid" );
    if( is_dir( "/proc/$pid" ) )
    {
     // plausibility check; is the running process a mapniktile server?
     if( readlink( "/proc/$pid/cwd" ) == '/var/www/wikiminiatlas/tiles' )
     {
      // check if the y directory exists, otherwise create it
      if( !is_dir( "mapnik/$z/$y" ) ) {
        $oldumask = umask(0);
        mkdir("mapnik/$z/$y",0755); 
        umask($oldumask);
      }
      $file = fopen( "/tmp/wikiminiatlas.tile" . $z . ".fifo", "w" );
      fwrite( $file, $x . " " . $y . "\n" ); 
      fclose( $file );
      $requested = true;
     }
    }

    // we should return an "out of service" image here!
    if( !$requested ) exit;

    /*for( $i = 0; $i < 10; $i++ )
    {
     if( file_exists( $tfile ) ) break;
     usleep( 500 );
    }
    if( strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') > 0 )
    {
     header( 'Content-type: image/png' );
     readfile( $tfile );
    }
    else
    {
     header( 'Cache-Control: no-cache' );
     //header( "Location: $url?" . rand() );
     header( 'Status: 500' );
    }*/
   } 
   else echo "outside range\n";
  }
  //else if( preg_match('{^merc/vmap0/([0-9]+)\/([0-9]+)\/([0-9]+)\.png$}',substr($url,strlen($base)), $matches) )
  else  if( preg_match('{^sat/([0-9]+)\/([0-9]+)\/([0-9]+)_([0-9]+)\.png}',substr($url,strlen($base)), $matches) )
  {
     // sat updates are deactivated for now, as the onearth server went down :-(
     header( 'Cache-Control: no-cache' );
     header( "Location: /tiles/dummy.png" );
     exit;

   $z = intval($matches[1]);
   $y = intval($matches[2]);
   $y2 = intval($matches[3]);
   $x = intval($matches[4]);

   $mx = 3 * ( 2 << $z );
   $my = $mx/2;

   //
   // was a legal tile number requested?
   //
   if( $z>=0 && $y>=0 && $x>=0 && $x<$mx && $y<$my && $y == $y2 ) 
   {
    $tfile = "mapnik/sat/$z/$y/" . $y . "_" . $x . ".png";
    umask( 0033 );
   
    $requested = false;
    $pid = file_get_contents( "/tmp/wikiminiatlas.sat.pid" );
    if( is_dir( "/proc/$pid" ) )
    {
     // plausibility check; is the running process a mapniktile server?
     if( readlink( "/proc/$pid/cwd" ) == '/var/www/wikiminiatlas/tiles' )
     {
      $file = fopen( "/tmp/wikiminiatlas.sat.fifo", "w" );
      fwrite( $file, $x . " " . $y . " " . $z . "\n" ); 
      fclose( $file );
      $requested = true;
     }
    }

    // we should return an "out of service" image here!
    if( !$requested ) exit;

    $nocache = 1;
    for( $i = 0; $i < 10; $i++ )
    {
     if( file_exists( $tfile ) ) { $nocache = 0; break; }
     usleep( 1000 );
    }
   
    if( $nocache == 1 ) header( 'Cache-control: no-cache,no-store,must-revalidate' );

    if( strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE') > 0 )
    {
     header( 'Content-type: image/png' );
     readfile( $tfile );
    }
    else
    {
     header( "Location: $url" );
     header( 'Status: 302' );
    }
   } 
   else echo "outside range\n";
  }
  else echo "filename format error: $url\n";
}
?>
