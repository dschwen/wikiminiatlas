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
foreach ($lrev as $lang => $rev)
{
?>

<tr>
<td><a href="https://<?= $lang ?>.<?= $lang == 'commons' ? 'wikimedia' : 'wikipedia' ?>.org/"><?= $lang ?></a></td>
<td><?= $rev ?></td>
</tr>

<?php
}
?>

</table>
