<?php

$x = intval($_GET['x']);
$y = intval($_GET['y']);
$z = intval($_GET['z']);

$a = $_GET['action'];

$tfile = "jsontile/$z/$y/$x";
$f = '';
ob_start("ob_gzhandler");
if( $a!=='query' && $a!=='print' ) {
  // set content type
  header( 'Content-type: application/json' );

  // check cache first
  if( $a !== 'purge' ) {
    if( file_exists( $tfile.'.gz' ) ) {
      // gzipped tile
      header("Cache-Control: public, max-age=3600");
      $f = implode("\n",gzfile($tfile.'.gz'));
    } else if( file_exists( $tfile ) ) {
      // old unpacked file
      $f = file_get_contents($tfile);
    }

    if( $f!='' ) {
      header("Cache-Control: public, max-age=3600");
      // parse json and check tile version ( or timestamp, or check file time)
      $d = json_decode($f);
      if( $d->v >= 4 ) {
        echo $f;
        exit;
      }
    }
  }
}

function beginsWith($str, $sub) {
  return (strncmp($str, $sub, strlen($sub)) == 0);
}
//$dbconn = pg_connect("host=sql-mapnik dbname=osm_mapnik port=5433");
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


$tags = array( "highway", "railway", "waterway", "landuse", "leisure", "building", "natural", "amenity", "name", "boundary", "osm_id","layer","access","route", "historic", "tunnel", "aeroway", "aerialway", "tourism" );
$taglist = '"'.implode($tags,'", "').'"';
$tagnum = count($tags);
$intersect = "
          ST_Intersection( 
            way,
            SetSRID('BOX3D($mllx $mlly, $murx $mury)'::box3d,900913)
          )";
//transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 900913 )
$table = array( 
  array('planet_polygon','building IS NULL AND  not exist(hstore(tags),\'building:part\') AND',$intersect), 
  array('planet_line','building IS NULL AND  not exist(hstore(tags),\'building:part\') AND',$intersect)
);

// also return buildings for large zoom levels
if( $z>=14 ) {
  $table[] = array('planet_polygon','(building IS NOT NULL OR exist(hstore(tags),\'building:part\')) AND','way');
  $table[] = array('planet_line','(building IS NOT NULL OR exist(hstore(tags),\'building:part\')) AND','way');
}

$geo = array();
$tagfound = array();
$idx = array();
for( $i=0; $i<count($table); $i++ ) {
  // build query for the cropped data without buildings
  $query = "
    select 
      ST_AsGeoJSON( transform(".$table[$i][2].",4326), 9 ),
      tags, $taglist
      from ".$table[$i][0]."
    where
      ".$table[$i][1]."
      ST_IsValid(way) AND way && SetSRID('BOX3D($mllx $mlly, $murx $mury)'::box3d,900913);
  ";

  // debug
  if( $a === 'query' ) {
    echo $query,"\n\n";
  }

  // perform query
  $result = pg_query($dbconn, $query);
  if( !$result ) {
    echo pg_last_error($dbconn);
    exit;
  }

  while ($row = pg_fetch_row($result)) {
    // decode geometry 
    $thisgeo = json_decode($row[0]);

    // is the geometry empty? then fetch next
    if( $thisgeo->type == 'GeometryCollection' &&
        empty($thisgeo->geometries) ) continue;

    // copy the OSM tags
    $type = array();
    for($j=0; $j<$tagnum; $j++) {
      if( $row[$j+2] !== null ) {
        //$type[$table[$i][3][$j]]=$row[$j+1];
        $type[$tags[$j]]=$row[$j+2];
        $tagfound[$tags[$j]]++;
        // server side index
        if( array_key_exists($tags[$j], $idx) ) {
          $idx[$tags[$j]][] = count($geo);
        } else {
          $idx[$tags[$j]] = array( count($geo) );
        }
      }
    }

    // filter the tags hstore
    if( $row[1] !== null ) {
      $hstore = json_decode('{' . str_replace('"=>"', '":"', $row[1]) . '}', true);
      foreach( $hstore as $j => $val ) {
        //if( beginsWith($j,'name:') ||  beginsWith($j,'tiger:')  ||  beginsWith($j,'nist:') ) continue;   
        if( beginsWith($j,'tiger:')  ||  beginsWith($j,'nist:') ) continue;   
        $type[$j]=$val;
        $tagfound[$j]++;
        // server side index
        if( array_key_exists($j, $idx) ) {
          $idx[$j][] = count($geo);
        } else {
          $idx[$j] = array( count($geo) );
        }
      }
    }

    // append geometry
    $geo[] = array( "geo" => $thisgeo, "tags" => $type );
  }
}

if( $a === 'print' ) exit;

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
//    ST_IsValid(the_geom) AND the_geom && SetSRID('BOX3D($mllx $mlly, $murx $mury)'::box3d,900913);
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
  $tagfound['natural']++;

  // server side index
  if( array_key_exists('natural', $idx) ) {
    $idx['natural'][] = count($geo);
  } else {
    $idx['natural'] = array( count($geo) );
  }

  $geo[] = array( "geo" => json_decode($row[0]), "tags" => $type );
}

//$s = json_encode( array( "data" => $geo, "x" => $x, "y" => $y, "z" => $z, "f" => $tagfound, "v" => 2, "idx" => $idx, "bbox" => "$mllx $mlly, $murx $mury" ) );
$s = json_encode( array( "data" => $geo, "x" => $x, "y" => $y, "z" => $z, "f" => $tagfound, "v" => 5, "idx" => $idx, "t" => time() ) );

// do not cache purge action
if( $a !== 'purge' ) {
  header("Cache-Control: public, max-age=3600");
}

// output JSON data
echo $s;

// write to cache
if( !is_dir( "jsontile/$z/$y" ) ) {
  $oldumask = umask(0);
  mkdir("jsontile/$z/$y",0755); 
  umask($oldumask);
}

//file_put_contents ( $tfile , $s );
file_put_contents ( $tfile.'.gz' , gzencode($s,9) );

?>
