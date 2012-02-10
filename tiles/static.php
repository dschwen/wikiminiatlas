<html>
<head>
<title>WikiMiniAtlas static map request</title>
</head>
<body>

<?php
$w = intval( $_GET['w'] );

$l1 = floatval( $_GET['lat1'] );
$l2 = floatval( $_GET['lat2'] );
if( $l1 > $l2 ) 
{
    $lat2 = $l1; $lat1 = $l2;
}
else
{
    $lat1 = $l1; $lat2 = $l2;
}

$l1 = floatval( $_GET['lon1'] );
$l2 = floatval( $_GET['lon2'] );
if( $l1 > $l2 ) 
{
    $lon2 = $l1; $lon1 = $l2;
}
else
{
    $lon1 = $l1; $lon2 = $l2;
}

if( $w > 2000 ) 
{
    $w = 2000;
    echo "The image size is limited to 2000px.";
}
if( $w < 10 ) $w = 10;

if( $lon1-$lon2 == 0 || $lat1-$lon1 == 0 )
{
    $lat1 = 40; $lat2 = 60;
    $lon1 = -10; $lon2 = 30;
    $w = 800;
}
?>

<form action="static.php" method="get">
Lat1:<input name="lat1" type="text" value="<? echo $lat1; ?>"> - Lat2:<input name="lat2" type="text" value="<? echo $lat2; ?>"> <br>
Lon1:<input name="lon1" type="text" value="<? echo $lon1; ?>"> - Lon2:<input name="lon2" type="text" value="<? echo $lon2; ?>"> <br>
Max Width or height: <input name="w" type="text" value="800"><br>
<input type="submit" name="s" value="Map it!">
</form>

<?php

if( $_GET['s'] == "Map it!" )
{
    $w = intval( $_GET['w'] );

    $l1 = floatval( $_GET['lat1'] );
    $l2 = floatval( $_GET['lat2'] );
    if( $l1 > $l2 ) 
    {
        $lat2 = $l1; $lat1 = $l2;
    }
    else
    {
        $lat1 = $l1; $lat2 = $l2;
    }

    $l1 = floatval( $_GET['lon1'] );
    $l2 = floatval( $_GET['lon2'] );
    if( $l1 > $l2 ) 
    {
        $lon2 = $l1; $lon1 = $l2;
    }
    else
    {
        $lon1 = $l1; $lon2 = $l2;
    }

    $params =  array( $lat1, $lat2, $lon1, $lon2, $w, 0 );
    $fname = "static/map_" . join( "_", $params ) . ".png";

    if( !is_readable( $fname ) )
    {
        echo "Rendering...<br>";
        system( "/home/dschwen/wma/programs/mapniktile/mapniktile_merc " . join( " ", $params ) . " " . $fname );
    }
    echo "Loading...<br><img src=\"$fname\">";
}

?>

</body>
</html>

