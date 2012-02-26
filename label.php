<?php

//error_reporting(E_ALL);
//ini_set('display_errors', 1);

// Apache .htaccess rules
$lang=$_GET['l'];
$y=floatval($_GET['a']);
$x=floatval($_GET['b']);
$z=intval($_GET['z']);

// experimental compressed query
$r=$_GET['r'];

//$rev=intval($_GET['rev']);

// get language id
$alllang=explode(',',"ar,bg,ca,ceb,commons,cs,da,de,el,en,eo,es,et,eu,fa,fi,fr,gl,he,hi,hr,ht,hu,id,it,ja,ko,lt,ms,new,nl,nn,no,pl,pt,ro,ru,simple,sk,sl,sr,sv,sw,te,th,tr,uk,vi,vo,war,zh,af,als,be,bpy,fy,ga,hy,ka,ku,la,lb,lv,mk,ml,nds,nv,os,pam,pms,ta,vec");
$l = array_search( $lang, $alllang );
if( $l === FALSE ) {
  echo "";
  exit;
}

// load table of most current revisions
require_once('rev.inc');

// select current revision
$rev = $lrev[$lang];

$wikiminiatlas_zoomsize = array( 3.0, 6.0 ,12.0 ,24.0 ,48.0, 96.0, 192.0, 384.0, 768.0, 1536.0,  3072.0, 6144.0, 12288.0, 24576.0, 49152.0, 98304.0 );

$ts_pw = posix_getpwuid(posix_getuid());
$ts_mycnf = parse_ini_file($ts_pw['dir'] . "/.my.cnf");
$db = mysql_connect($lang.'wiki-p.db.toolserver.org', $ts_mycnf['user'], $ts_mycnf['password']);
unset($ts_mycnf, $ts_pw);
mysql_select_db($lang.'wiki_p', $db);

if( $r != NULL ) {
  $co = Array('x','y');
  $q = Array();
  $n = 0;

  // decode compressed query
  $qi = explode("|",$r);
  if( ( count($qi) < 1 ) || ( count($qi) > 10 ) ) exit;
  foreach( $qi as $i ) {
    $qp = explode(",",$i);
    if( count($qp) < 1 || count($qp) > 2 ) exit;
    $s=""; $n2=1;
    for($j=0;$j<2;$j++) { 
      // = or >= <=
      $k=explode("-",$qp[$j]);
      if( count($k) == 1 ) {
        $s .= "t.".$co[$j]."=".intval($k[0]);
      } 
      else if( count($k) == 2 ){
        $s .= "t.".$co[$j].">=".intval($k[0])." AND t.".$co[$j]."<=".intval($k[1]);
        $n2 *= max(0,intval($k[1])-intval($k[0]));
      }
      else exit;

      if($j==0) $s .= " AND ";
    }

    // add query term
    $q[] = "(".$s.")";
    $n += $n2;
  }
   
  if( $n2 > 500 ) {
    echo "Requesting too many tiles!";
    exit;
  }
  $query = "select p.page_title as title, l.name as name, l.lat as lat, l.lon as lon, l.style as style, t.x as dx, t.y as dy from  page p, u_dschwen.wma_tile t, u_dschwen.wma_connect c, u_dschwen.wma_label l  WHERE l.lang_id='$l' AND c.rev='$rev' AND c.tile_id=t.id AND ( ".implode(" OR ",$q)." ) AND c.label_id=l.id AND t.z='$z' AND p.page_id = l.page_id AND c.tile_id = t.id AND page_namespace=0 AND l.page_id=p.page_id;";
  //echo $query,"\n";
  //exit;
} else {
  $query = "select p.page_title as title, l.name as name, l.lat as lat, l.lon as lon, l.style as style, t.x as dx, t.y as dy from  page p, u_dschwen.wma_tile t, u_dschwen.wma_connect c, u_dschwen.wma_label l  WHERE l.lang_id='$l' AND c.rev='$rev' AND c.tile_id=t.id AND t.x='$x' AND c.label_id=l.id  AND t.y='$y' AND t.z='$z' AND p.page_id = l.page_id AND c.tile_id = t.id AND page_namespace=0 AND l.page_id=p.page_id;";
}
$res = mysql_query( $query );

$items = array();
while( $row = mysql_fetch_array( $res) )
{
  $x = $row['dx'];
  $y = $row['dy'];

  $ymin = (180*$y)/$wikiminiatlas_zoomsize[$z] - 90.0;
  $ymax = $ymin + 180.0/$wikiminiatlas_zoomsize[$z];
  $xmin = (180.0*$x)/$wikiminiatlas_zoomsize[$z];

  $ty = intval( ( ( $ymax - $row["lat"] ) * $wikiminiatlas_zoomsize[$z] * 128) / 180.0 );
  $tx = intval( ( ( $row["lon"] - $xmin ) * $wikiminiatlas_zoomsize[$z] * 128) / 180.0 );
  $s = $row['style'];

  $items[] = array( 
    "style" => $s,
    "lang"  => $lang,
    "page"  => urlencode($row["title"]),
    "tx"    => $tx,
    "ty"    => $ty,
    "name"  => $row['name'],
    "dx"  => $x,
    "dy"  => $y
  );
}
mysql_close( $db );
header("Content-type: application/json");
echo json_encode( array( "label" => $items, "z" => $z ) );
?>
