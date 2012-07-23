<?php

$dbconn = pg_connect("host=sql-mapnik dbname=osm_mapnik");

$urx = 11.0;
$ury = 49.01;
$llx = 10.99;
$lly = 49.0;

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
      //ST_GeomFromText('POLYGON(($llx $ury, $urx $ury, $llx $llr, $lrx $lry, $ulx $uly))', 4326 )) AS bbox_nodes;

$result = pg_query($dbconn, $query);
if( !$result ) {
  echo pg_last_error($dbconn);
  exit;
}

while ($row = pg_fetch_row($result)) {
  echo "$row[0]<br/>\n";
}

?>
