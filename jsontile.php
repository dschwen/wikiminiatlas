<?php


$x = intval($_GET['x']);
$y = intval($_GET['y']);
$z = intval($_GET['z']);

$a = $_GET['action'];

ob_start("ob_gzhandler");
header("Cache-Control: public, max-age=3600");
if( $a!=='query' ) {
  // set content type
  header( 'Content-type: application/json' );

  // check cache first
  if( $a !== 'purge' ) {
    $tfile = "jsontile/$z/$y/$x";
    if( file_exists( $tfile ) ) {
      readfile( $tfile );
      exit;
    }
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

// add ten pixel worth of padding
$dx = ($urx-$llx)*10/128;
$dy = ($ury-$lly)*10/128;
$llx -= $dx;
$lly -= $dy;
$urx += $dx;
$ury += $dy;

// get mercator bounds
$mllx = deg2rad($llx>180?($llx-360.0):$llx)*6378137.0;
$mlly = log(tan(M_PI_4 + deg2rad($lly) / 2.0)) * 6378137.0;
$murx = deg2rad($urx>180?($urx-360.0):$urx)*6378137.0;
$mury = log(tan(M_PI_4 + deg2rad($ury) / 2.0)) * 6378137.0;


$tags = array( "highway", "railway", "waterway", "landuse", "leisure", "building", "natural", "amenity", "name", "boundary", "osm_id","layer","access","route", "historic", "tunnel", "aeroway", "aerialway" );
$taglist = '"'.implode($tags,'", "').'"';
$tagnum = count($tags);
$intersect = "
          ST_Intersection( 
            way,
            SetSRID('BOX3D($mllx $mlly, $murx $mury)'::box3d,900913)
          )";
//transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 )
$table = array( 
  array('planet_polygon','building IS NULL AND',$intersect), 
  array('planet_line','',$intersect)
);

/*
$table = array( 
  array( "(SELECT way, waterway, \"natural\" from planet_polygon where ( waterway in ('riverbank','dock') ) or ( \"natural\" in ('water','bay','wetland','wood', 'grassland','fell') ) ) as foo",'',$intersect,array('waterway','natural')),
  array("(SELECT way, landuse,leisure from planet_polygon where landuse in ('military','railway','commercial','industrial','residential','retail','basin','salt_pond','orchard','cemetary','meadow','village_green','forrest','recreation_ground') or leisure in ('dog_park','garden','park','pitch','stadium') ) as foo",'',$intersect,array('landuse','leisure')),
  array( "(SELECT way,waterway from planet_line where waterway in ('canal','river','stream')) as foo",'',$intersect,array('waterway')),
  array( "(SELECT way,route from planet_line where route in ('ferry')) as foo",'',$intersect,array('route')),
  array( "(SELECT way,railway from planet_line where railway in ('rail','preserved')) as foo",'',$intersect,array('railway')),
  array( "(SELECT way,highway from planet_line where highway in ('track','path','residential','tertiary','tertiary_link','unclassified','service')) as foo",'',$intersect,array('highway')),
  array( "(SELECT way,highway from planet_line where highway in ('primary','primary_link','secondary','secondary_link','motorway','motorway_link','trunk','trunk_link')) as foo",'',$intersect,array('highway'))
);

$table = array( 
  array( "(SELECT * from planet_polygon where ( waterway in ('riverbank','dock') ) or ( \"natural\" in ('water','bay','wetland','wood', 'grassland','fell') ) ) as foo",'',$intersect),
  array( "(SELECT * from planet_polygon where landuse in ('military','railway','commercial','industrial','residential','retail','basin','salt_pond','orchard','cemetary','meadow','village_green','forrest','recreation_ground') or leisure in ('dog_park','garden','park','pitch','stadium') ) as foo",'',$intersect),
  array( "(SELECT * from planet_line where waterway in ('canal','river','stream')) as foo",'',$intersect),
  array( "(SELECT * from planet_line where route in ('ferry')) as foo",'',$intersect),
  array( "(SELECT * from planet_line where railway in ('rail','preserved')) as foo",'',$intersect),
  array( "(SELECT * from planet_line where highway in ('track','path')) as foo",'',$intersect),
  array( "(SELECT * from planet_line where highway in ('residential','tertiary','tertiary_link','unclassified','service')) as foo",'',$intersect),
  array( "(SELECT * from planet_line where highway in ('primary','primary_link','secondary','secondary_link')) as foo",'',$intersect),
  array( "(SELECT * from planet_roads where highway in ('motorway','motorway_link','trunk','trunk_link')) as foo",'',$intersect)
);
*/

// also return buildings for large zoom levels
if( $z>=14 ) $table[] = array('planet_polygon','building IS NOT NULL AND','way',$tags);

$geo = array();
$tagfound = array();
for( $i=0; $i<count($table); $i++ ) {
  // build query for the cropped data without buildings
  //$taglist = '"'.implode($table[$i][3],'", "').'"';
  //$tagnum = count($table[$i][3]);
  $query = "
    select 
      ST_AsGeoJSON( transform(".$table[$i][2].",4326), 9 ),
      $taglist
      from ".$table[$i][0]."
    where
      ".$table[$i][1]."
      way && SetSRID('BOX3D($mllx $mlly, $murx $mury)'::box3d,900913);
  ";

//      way && SetSRID('BOX3D($llx $lly, $urx $ury)'::box3d,4326);
//      way && SetSRID('BOX3D($mllx $mlly, $murx $mury)'::box3d,900913);
/*
      ST_Intersects
        way, 
        transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 ) 
      );
 */

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
        //$type[$table[$i][3][$j]]=$row[$j+1];
        $type[$tags[$j]]=$row[$j+1];
        $tagfound[$tags[$j]]++;
      }
    } 
    $geo[] = array( "geo" => json_decode($row[0]), "tags" => $type );
  }
}

// get ocean data
$query = "
  select 
    ST_AsGeoJSON( transform( 
      ST_Intersection( 
        the_geom,
        SetSRID('BOX3D($mllx $mlly, $murx $mury)'::box3d,900913)
      ) ,4326), 9 )
    from coastlines
  where
    the_geom && SetSRID('BOX3D($mllx $mlly, $murx $mury)'::box3d,900913);
";
//transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 )

// perform query
$result = pg_query($dbconn, $query);
if( !$result ) {
  echo pg_last_error($dbconn);
  exit;
}

// get result, set tag natural=>ocean
$type = array( "natural" => "ocean" );
while ($row = pg_fetch_row($result)) {
  $geo[] = array( "geo" => json_decode($row[0]), "tags" => $type );
  $tagfound['natural']++;
}

$s = json_encode( array( "data" => $geo, "x" => $x, "y" => $y, "z" => $z, "f" => $tagfound ) );

// write to cache
if( !is_dir( "jsontile/$z/$y" ) ) {
  $oldumask = umask(0);
  mkdir("jsontile/$z/$y",0755); 
  umask($oldumask);
}
file_put_contents ( $tfile , $s );

echo $s;
?>
