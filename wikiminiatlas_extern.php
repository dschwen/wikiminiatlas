<? 
ob_start("ob_gzhandler"); 
header('Content-type: text/javascript');
?>
/************************************************************************
 *
 * WikiMiniAtlas (c) 2006-2010 by Daniel Schwen
 *  Script to embed interactive maps into pages that have coordinate templates
 *  also check my commons page [[:commons:User:Dschwen]] for more tools
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or (at
 * your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA.
 *
 ************************************************************************/

// include files
<? 
require( 'min/json2.min.js' ); 
require( 'min/utils.min.js' ); 
require( 'min/glMatrix-0.9.5.custom.js' ); 
require( 'min/wmaglobe3d.min.js' ); 
require( 'min/poly2tri.min.js' );

require( 'wikiminiatlas_i18n.inc' );

if( false ) {
  require( 'wmajt.js' ); 
  require( 'wmacore.js' );
} else {
  require( 'min/wmajt.min.js' ); 
  require( 'min/wmacore.min.js' );
}
?>
