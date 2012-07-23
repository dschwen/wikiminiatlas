<?php

$dbconn = pg_connect("host=sql-mapnik dbname=osm_mapnik");

$x = intval($_GET['x']);
$y = intval($_GET['y']);
$z = intval($_GET['z']);

// only reply for high zoomlevels!
if( $z < 12 ) exit;

// padding in pixels
$pad = 10;

// coordinates of upper right and lower left corners
$urx = 11.0;
$ury = 49.01;
$llx = 10.99;
$lly = 49.0;

// size of zoom level in tiles
$mx = 3 * ( 2 << $z );
$my = $mx/2;

// build query for the cropped data
$query = "
  select 
    ST_AsGeoJSON(
      transform(
        ST_Intersection( 
          way,
          transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 )
        )
      ,4326),9) from planet_polygon
  where
    ST_Intersects(
      way, 
      transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 ) 
    );
";

// perform query
$result = pg_query($dbconn, $query);
if( !$result ) {
  echo pg_last_error($dbconn);
  exit;
}

while ($row = pg_fetch_row($result)) {
  echo "$row[0]<br/>\n";
}

?>
