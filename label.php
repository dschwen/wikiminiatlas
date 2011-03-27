<?php

// Apache .htaccess rules
$lang=$_GET['l'];
$y=floatval($_GET['a']);
$x=floatval($_GET['b']);
$z=intval($_GET['c']);

// Sun webserver
/*
$url = $_SERVER['REDIRECT_URL']; 
if( preg_match('{^/wma/label/([^_]+)_([0-9]+)_([0-9]+)_([0-9]+)$}', $url, $matches) )
{
 $lang=$matches[1];
 $y=floatval($matches[2]);
 $x=floatval($matches[3]);
 $z=intval($matches[4]);
}
else
{
 echo "Invalid URL\n";
 // exit;
}
 */

// get language id
$alllang=split(',',"ar,bg,ca,ceb,commons,cs,da,de,el,en,eo,es,et,eu,fa,fi,fr,gl,he,hi,hr,ht,hu,id,it,ja,ko,lt,ms,new,nl,nn,no,pl,pt,ro,ru,simple,sk,sl,sr,sv,sw,te,th,tr,uk,vi,vo,war,zh");
$l = array_search( $lang, $alllang );
if( $l == FALSE ) {
  echo "Invalid language\n";
  exit;
}
echo "$lang = $l\n";

$wikiminiatlas_zoomsize = array( 3.0, 6.0 ,12.0 ,24.0 ,48.0, 96.0, 192.0, 384.0, 768.0, 1536.0,  3072.0, 6144.0, 12288.0, 24576.0, 49152.0, 98304.0 );

$ts_pw = posix_getpwuid(posix_getuid());
$ts_mycnf = parse_ini_file($ts_pw['dir'] . "/.my.cnf");
$db = mysql_connect($lang.'wiki-p.db.toolserver.org', $ts_mycnf['user'], $ts_mycnf['password']);
unset($ts_mycnf, $ts_pw);
mysql_select_db($lang.'wiki_p', $db);

$query = "select p.page_title as title, l.name as name, l.lat as lat, l.lon as lon, l.style as style from  page p, u_dschwen.wma_tile t, u_dschwen.wma_connect c, u_dschwen.wma_label l  WHERE l.lang_id='$l' AND c.rev='$rev' AND c.tile_id=t.id AND t.x='$x' AND c.label_id=l.id  AND t.y='$y' AND t.z='$z' AND p.page_id = l.page_id AND c.tile_id = t.id AND page_namespace=0 AND l.page_id=p.page_id;";
echo $query,"\n";
$res = mysql_query( $query );

$ymin = (180*$y)/$wikiminiatlas_zoomsize[$z] - 90.0;
$ymax = $ymin + 180.0/$wikiminiatlas_zoomsize[$z];
$xmin = (180.0*$x)/$wikiminiatlas_zoomsize[$z];

while( $row = mysql_fetch_array( $res) )
{
  $ty = intval( ( ( $ymax - $row["lat"] ) * $wikiminiatlas_zoomsize[$z] * 128) / 180.0 );
  $tx = intval( ( ( $row["lon"] - $xmin ) * $wikiminiatlas_zoomsize[$z] * 128) / 180.0 );

  echo '<a class="label', $row['style'], '" target="_top" href="http://',$lang,'.wikipedia.org/wiki/', urlencode($row["title"]), '" style="top:', $ty, 'px; left:', $tx, 'px;">', $row['name'], "</a><br>";
}

mysql_close( $db );
?>
