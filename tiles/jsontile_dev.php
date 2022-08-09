<?php
//error_reporting(E_ALL);
//ini_set('display_errors', 1);
error_reporting(E_ERROR | E_PARSE);

$x = intval($_GET['x']);
$y = intval($_GET['y']);
$z = intval($_GET['z']);

$a = NULL;
if (array_key_exists('action', $_GET)) $a=$_GET['action'];

$tfile = "jsontile/$z/$y/$x";
$f = '';
ob_start("ob_gzhandler");
if ($a!=='query' && $a!=='print') {
  // set content type
  header( 'Content-type: application/json' );

  // check cache first
  if( $a !== 'purge' ) {
    if( file_exists( $tfile.'.gz' ) ) {
      // gzipped tile
      $f = implode("",gzfile($tfile.'.gz'));
    } else if( file_exists( $tfile ) ) {
      // old unpacked file
      $f = file_get_contents($tfile);
    }

    if ($f!='') {
      header("Cache-Control: public, max-age=3600");
      // parse json and check tile version ( or timestamp, or check file time)
      $d = json_decode($f);
      if( $d->v >= 6 ) {
        echo $f;
        exit;
      }
    }
  }
}

function beginsWith($str, $sub) {
  return (strncmp($str, $sub, strlen($sub)) == 0);
}

// only reply for high zoomlevels!
if ($z<12) exit;

//exit; // DB server under maintenance

// connect to database
$ts_pw = posix_getpwuid(posix_getuid());
$ts_mycnf = parse_ini_file($ts_pw['dir'] . "/postgres.cnf");
$dbconn = pg_connect("host=maps-osmdb dbname=gis user=" . $ts_mycnf['user'] . " password=" . $ts_mycnf['password']);
unset($ts_mycnf, $ts_pw);

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

// make sure the longitude is between -180 and 180
if ($urx>180.0) {
  $urx -= 360.0;
  $llx -= 360.0;
}

// add ten pixel worth of padding
$dx = ($urx-$llx)*10/128;
$dy = ($ury-$lly)*10/128;
$llx -= $dx;
$lly -= $dy;
$urx += $dx;
$ury += $dy;

// get mercator bounds
$mllx = deg2rad($llx)*6378137.0;
$mlly = log(tan(M_PI_4 + deg2rad($lly) / 2.0)) * 6378137.0;
$murx = deg2rad($urx)*6378137.0;
$mury = log(tan(M_PI_4 + deg2rad($ury) / 2.0)) * 6378137.0;


$tags = array( "highway", "railway", "waterway", "landuse", "leisure", "building", "natural", "amenity", "name", "boundary", "osm_id","layer","access","route", "historic", "tunnel", "aeroway", "aerialway", "tourism", "man_made" );
$taglist = '"'.implode($tags,'", "').'"';
$tagnum = count($tags);
$box = "ST_Transform(ST_SetSRID('BOX3D( $llx $lly, $urx $ury )'::box3d,4326),3857)";
$intersect = "ST_Intersection(way, $box)";
//transform( ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $urx $lly, $llx $lly, $llx $ury))', 4326 ), 3857 )
$table = array(
  array('planet_osm_polygon','building IS NULL AND (tags IS NULL OR NOT exist(hstore(tags),\'building:part\')) AND',$intersect),
  array('planet_osm_line','building IS NULL AND (tags IS NULL OR NOT exist(hstore(tags),\'building:part\')) AND',$intersect)
);

// also return buildings for large zoom levels
if( $z>=14 ) {
  $table[] = array('planet_osm_polygon','(building IS NOT NULL OR exist(hstore(tags),\'building:part\')) AND','way');
  $table[] = array('planet_osm_line','(building IS NOT NULL OR exist(hstore(tags),\'building:part\')) AND','way');
}

$geo = array();
$tagfound = array();
$idx = array();
for( $i=0; $i<count($table); $i++ ) {
  // build query for the cropped data without buildings
  $query = "
    select
      ST_AsGeoJSON( ST_Transform(".$table[$i][2].",4326), 9 ),
      tags, $taglist
      from ".$table[$i][0]."
    where
      ".$table[$i][1]." ST_IsValid(way) AND ST_Intersects(way, $box);";
      // ".$table[$i][1]." ST_IsValid(way) AND way && $box;";
  // ST_IsValid(way) AND way && ST_SetSRID('BOX3D($llx $lly, $urx $ury)'::box3d,4326);

  // debug
  if ($a === 'query') {
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

        if (array_key_exists($tags[$j], $tagfound)) {
          $tagfound[$tags[$j]]++;
        } else {
          $tagfound[$tags[$j]] = 1;
        }

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

        if (array_key_exists($j, $tagfound)) {
          $tagfound[$j]++;
        } else {
          $tagfound[$j] = 1;
        }

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

// get landmass polygons and coastlines
$table = array('land_polygons','coastlines');
for ($i=0; $i<2; $i++) {
  // set up query
  $query = "
    select
      ST_AsGeoJSON(
        ST_Intersection(
          ST_SetSRID(wkb_geometry, 4326),
          ST_SetSRID('BOX3D($llx $lly, $urx $ury)'::box3d, 4326)
        )
      , 9 )
      from ".$table[$i]."
    where
      ST_Intersects(wkb_geometry, ST_SetSRID('BOX3D($llx $lly, $urx $ury)'::box3d,4326));
  ";

  // perform query
  $result = pg_query($dbconn, $query);
  if( !$result ) {
    echo pg_last_error($dbconn);
    exit;
  }

  // get result, set tag natural=>land_polygons or coastlines
  $type = array( "natural" => $table[$i] );
  while ($row = pg_fetch_row($result)) {

    if (array_key_exists('natural', $tagfound)) {
      $tagfound['natural']++;
    } else {
      $tagfound['natural'] = 1;
    }

    // server side index
    if( array_key_exists('natural', $idx) ) {
      $idx['natural'][] = count($geo);
    } else {
      $idx['natural'] = array( count($geo) );
    }

    $geo[] = array( "geo" => json_decode($row[0]), "tags" => $type );
  }
}

//$s = json_encode( array( "data" => $geo, "x" => $x, "y" => $y, "z" => $z, "f" => $tagfound, "v" => 6, "idx" => $idx, "t" => time(), "mbbox" => "$mllx $mlly, $murx $mury", "bbox" => "$llx $lly, $urx $ury" ) );
$s = json_encode( array( "data" => $geo, "x" => $x, "y" => $y, "z" => $z, "f" => $tagfound, "v" => 6, "idx" => $idx, "t" => time() ) );

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
