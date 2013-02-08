<? 
ob_start("ob_gzhandler"); 
header('Content-type: text/javascript');
?>
/************************************************************************
 *
 * WikiMiniAtlas (c) 2006-2013 by Daniel Schwen, licensed under GPLv3
 *  Script to embed interactive maps into pages that have coordinate templates
 *  see:
 *  * http://meta.wikimedia.org/wiki/WikiMiniAtlas
 *  * https://github.com/dschwen/wikiminiatlas
 *
 * WMA contains the following third party liraries:
 *  * http://jquery.org/ (MIT license)
 *  * https://github.com/douglascrockford/JSON-js (PD)
 *  * https://github.com/toji/gl-matrix/blob/master/LICENSE.md 
 *  * Poly2Tra, Copyright (c) 2009-2010, Poly2Tri Contributors
 *    http://code.google.com/p/poly2tri/
 *
 ************************************************************************/

// include files
<? 
require( 'min/jquery.min.js' );
require( 'min/json2.min.js' ); 
require( 'min/utils.min.js' ); 
require( 'min/glMatrix-0.9.5.custom.js' ); 
require( 'min/wmaglobe3d.min.js' ); 
require( 'min/poly2tri.min.js' );

require( 'wikiminiatlas_i18n.inc' );

if( true ) {
  require( 'wmajt_dev.js' ); 
  require( 'wmacore_dev.js' );
} else {
  require( 'min/wmajt_dev.min.js' ); 
  require( 'min/wmacore_dev.min.js' );
}
?>
