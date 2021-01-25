<?php

//
// label.php version for WMF Cloud, (c) 2021 Daniel Schwen
//

require 'master.inc';

// no errors
error_reporting(0);
?>

<html>
<head><title></title></head>
<body>

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
