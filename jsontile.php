<?php

$dbconn = pg_connect("host=sql-mapnik dbname=osm_mapnik");

$x = intval($_GET['x']);
$y = intval($_GET['y']);
$z = intval($_GET['z']);

$a = intval($_GET['action']);

// only reply for high zoomlevels!
if( $z < 12 ) exit;

// size of zoom level in tiles
$mx = 3 * ( 2 << $z );
$my = $mx/2;

// drop illegal requests
if( $x<0 || $y<0 || $x>$mx || $y>$my ) exit;

// padding in pixels
$pad = 10;

// coordinates of upper right and lower left corners
/*$urx = 11.0;
$ury = 49.01;
$llx = 10.99;
$lly = 49.0;*/

$llx = $x*60.0/(1<<$z);
$lly = 90.0 - ( (($y+1.0)*60.0) / (1<<$z) );
$urx = ($x+1) * 60.0 / (1<<$z);
$ury = 90.0 - ( ($y*60.0) / (1<<$z) );

$table = array( 'planet_polygon', 'planet_line' );
$geo = array();

for( $i=0; $i<2; $i++ ) {
  // build query for the cropped data
  $query = "
    select 
      ST_AsGeoJSON(
        transform(
          ST_Intersection( 
            way,
            transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 )
          )
        ,4326),9) from $table[$i]
    where
      ST_Intersects(
        way, 
        transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 ) 
      );
  ";

  // debug
  /*if( $a == "query" ) {
    echo $query;
    exit;
  }*/

  // perform query
  $result = pg_query($dbconn, $query);
  if( !$result ) {
    echo pg_last_error($dbconn);
    exit;
  }

  while ($row = pg_fetch_row($result)) {
    $geo[] = array( "geo" => json_decode($row[0]), "type" => "line" );
  }
}

echo json_encode($geo);
?>
