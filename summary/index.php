<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

$title = $_GET['t'];

$lang  = $_GET['l'];
if( $lang =='' ) $lang = 'en';

$chars = intval($_GET['c']);
if( $chars == 0 ) $chars = 500;

$title = str_replace( ' ', '_', $title );
$key = $lang.':'.$title;

// check database
$db = mysqli_connect('p:tools.labsdb', $ts_mycnf['user'], $ts_mycnf['password'], 'u1115__summary');
$query = 'select synopsis from synopsis where page_title="'.mysql_real_escape_string( $key ).'" AND updated > DATE_SUB(NOW(), INTERVAL 30 DAY);';
$res = mysqli_query($db, $query);
$num = mysqli_num_rows( $res );

// if a result is found, use it, if not generate a new synopsis
if( $num > 0 )
{
  $row = mysqli_fetch_row( $res );
  $html = $row[0];
  echo $html;
}
else
{
  // obtain page text
  $opts = array(
    'http' => array(
      'method' => "GET",
      'header' => "User-Agent: WikiMiniAtlas-Summary-Generator/1.0 UserDschwen\r\n" 
    )
  ); 
  $context = stream_context_create( $opts );
  $url   = "http://".$lang.".wikipedia.org/wiki/".$title;
  $html = file_get_contents( $url."?action=render", false, $context );

  $dom = new domDocument;
  $dom->loadHTML( '<?xml encoding="UTF-8">' . $html);
  $dom->preserveWhiteSpace = false;

  // remove tables
  $nodearr=array();
  $nodelist = $dom->getElementsByTagName('table');
  foreach( $nodelist as $node ) { $nodearr[] = $node; }
  foreach( $nodearr as $node ) { $node->parentNode->removeChild($node); }

  // get first paragraph (skip coordinate paragraphs)
  do {
    $para = $dom->getElementsByTagName('p')->item(0);
    $delete = false;

    // test for coordinates en,de
    if( $para->childNodes->length == 1 && $para->childNodes->item(0)->nodeName == 'span' ) {
      $delete = true;
    }

    if( $delete ) {
      $para->parentNode->removeChild($para);
    } else {
      break;
    }
  } while(true);

  $out = new DOMDocument();
  $out->appendChild($out->importNode($para, true));

  // remove #-links, set target top on regular links
  $nodearr=array();
  $nodelist = $out->getElementsByTagName('a');
  foreach( $nodelist as $node ) {
    if( substr($node->attributes->getNamedItem('href')->value,0,1) == '#' ) {
      $nodearr[] = $node;
    } /*else {
      $node->setAttribute("target", "_top");
    }*/
  }
  foreach( $nodearr as $node ) { $node->parentNode->removeChild($node); }

  $html = $out->saveHTML();
  echo $html;

  if( !$fromcache ) {
    $query = 'delete from synopsis where page_title="'.mysqli_real_escape_string($db, $key).'"';
    $res = mysqli_query($db, $query);
    $query = 'insert into synopsis (page_title,synopsis) values ("'.mysqli_real_escape_string($db, $key).'","'.mysqli_real_escape_string($db, $html).'")';
    $res = mysql_query($db, $query);
  }
}

?>
