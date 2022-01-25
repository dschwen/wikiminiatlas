<?php

//
// status.php version for WMF Cloud, (c) 2021-2022 Daniel Schwen
//

require 'master.inc';

// no errors
error_reporting(0);

// get disk usage
$dfree = disk_free_space('/volume');
$dtotal = disk_total_space('/volume');
$puse = floor(100*($dtotal-$dfree)/$dtotal);
$guse = floor((($dtotal-$dfree)/1024/1024/1024)*100)/100;
$gtotal = floor(($dtotal/1024/1024/1024)*100)/100;
?>

<html>
<head><title></title>
<script src="min/jquery.min"></script>
</head>
<body>

<h2>Map tile overviews</h2>
<p><?= $puse ?>% tile cache used. (<?= $guse . '/' . $gtotal ?>GB</p>
<div id="overview"></div>
<p><a href="overview/overview_8.gif">8</a>,
<a href="overview/overview_9.gif">9</a>,
<a href="overview/overview_10.gif">10</a>,
<a href="overview/overview_11.gif">11</a>,
<a href="overview/overview_12.gif">12</a> gifs.</p>
<div id="map"></div>

<h2>Extraction logs</h2>
<p><a href="/logs">Cick here</a></p>

<h2>Label revisions</h2>
<table>

<?php

$coords = array(
  "de" => "Coordinate",
  "eo" => "Koord",
  "eu" => "Koord",
  "gl" => "Coordenadas",
  "ko" => "좌표",
  "ku" => "Koord",
  "hu" => "Koord",
  "nl" => "Coor_title_dms",
  "nn" => "Koord",
  "no" => "Koord",
  "pl" => "Współrzędne",
  "sl" => "Koord",
  "tr" => "Koordinat"
);

foreach ($lrev as $lang => $rev)
{
  if (array_key_exists($lang, $coords))
    $coord = $coords[$lang];
  else
    $coord = "Coord";

  $url = "https://" .$lang . "." . ($lang == 'commons' ? 'wikimedia' : 'wikipedia') . ".org/";
?>

<tr>
<td>
<a href="<?= $url ?>/"><?= $lang ?></a>
<sup>
  <a href="<?= $url ?>/wiki/Template_talk:<?= $coord ?>">coord</a>, 
  <a href="https://meta.wikimedia.org/wiki/WikiMiniAtlas/<?= $lang ?>">meta</a>,
  <a href="/logs/log_<?= $lang ?>.html">log</a>,
  <a href="/#<?= $lang ?>">map</a> 
</sup>
</td>
<td><?= $rev ?></td>
</tr>

<?php
}
?>

</table>
<script src="status.js"></script>
</body>
