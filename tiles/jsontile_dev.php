<?php


$x = intval($_GET['x']);
$y = intval($_GET['y']);
$z = intval($_GET['z']);

$a = $_GET['action'];

ob_start("ob_gzhandler");
header( 'Content-type: application/json' );

// check cache first
if( $a !== 'purge' ) {
  $tfile = "jsontile/$z/$y/$x";
  if( file_exists( $tfile ) ) {
    readfile( $tfile );
    exit;
  }
}

$dbconn = pg_connect("host=sql-mapnik dbname=osm_mapnik");


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

$tags = array( "highway", "railway", "waterway", "landuse", "leisure", "building", "natural", "amenity", "name", "boundary", "osm_id","layer" );
$taglist = '"'.implode($tags,'", "').'"';
$tagnum = count($tags);
$intersect = "
          ST_Intersection( 
            way,
            transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 )
          )";
$table = array( 
  array('planet_polygon','building IS NULL AND',$intersect), 
  array('planet_line','',$intersect)
);

// also return buildings for large zoom levels
if( $z>=14 ) $table[] = array('planet_polygon','building IS NOT NULL AND','way');

$geo = array();

for( $i=0; $i<count($table); $i++ ) {
  // build query for the cropped data without buildings
  $query = "
    select 
      ST_AsGeoJSON( transform(".$table[$i][2].",4326), 9 ),
      $taglist
      from ".$table[$i][0]."
    where
      ".$table[$i][1]."
      ST_Intersects(
        way, 
        transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 ) 
      );
  ";

  // debug
  if( $a === 'query' ) {
    echo $query;
    exit;
  }

  // perform query
  $result = pg_query($dbconn, $query);
  if( !$result ) {
    echo pg_last_error($dbconn);
    exit;
  }

  while ($row = pg_fetch_row($result)) {
    // copy the OSM tags
    $type = array();
    for($j=0; $j<$tagnum; $j++) {
      if( $row[$j+1] !== null ) {
        $type[$tags[$j]]=$row[$j+1];
      }
    } 
    $geo[] = array( "geo" => json_decode($row[0]), "tags" => $type );
  }
}

$s = json_encode( array( "data" => $geo, "x" => $x, "y" => $y, "z" => $z ) );

// write to cache
if( !is_dir( "jsontile/$z/$y" ) ) {
  $oldumask = umask(0);
  mkdir("jsontile/$z/$y",0755); 
  umask($oldumask);
}
file_put_contents ( $tfile , $s );

echo $s;
?>
