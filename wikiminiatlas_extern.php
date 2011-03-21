<? ob_start("ob_gzhandler"); ?>
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

// include minified jquery
<? require( 'jquery-1.4.4.min.js' ); ?>

// defaults
var wikiminiatlas_coordinate_region = '';
var wikiminiatlas_width = 500;
var wikiminiatlas_height = 300;

var wikiminiatlas_imgbase = 'http://toolserver.org/~dschwen/wma/tiles/';
var wikiminiatlas_database = 'http://toolserver.org/~dschwen/wma/label/';

// globals
var wikiminiatlas_widget = null;
var wikiminiatlas_map = null;
var wikiminiatlas_own_close = false;
var wikiminiatlas_nx;
var wikiminiatlas_ny;
var wikiminiatlas_tile;
var wikiminiatlas_old_onmouseup;
var wikiminiatlas_old_onmousemove;
var wikiminiatlas_dragging = null;
var wikiminiatlas_gx = 0;
var wikiminiatlas_gy = 0;
var wikiminiatlas_zoom = 1;
var wikiminiatlas_defaultzoom = 0;
var wikiminiatlas_zoomsize = [ 3, 6 ,12 ,24 ,48, 96, 192, 384, 768, 1536,  3072, 6144, 12288, 24576, 49152, 98304 ];
var marker = { obj: null, lat: 0, lon: 0 };
var extramarkers = [];
var wikiminiatlas_marker_locked = true;
var wikiminiatlas_taget_button = null;
var wikiminiatlas_settings = null;
var wikiminiatlas_xmlhttp = false;
var wikiminiatlas_xmlhttp_callback = false;
var wikiminiatlas_language = 'de';
var wikiminiatlas_site = '';
var UILang = 'en';

var circ_eq = 40075.0; // equatorial circumfence in km
var scalelabel = null;
var scalebar = null;

var synopsis = null;
var synopsis_filter = null;
var synopsistext = null;

var wmaci_panel = null;
var wmaci_image = null;
var wmaci_image_span = null;
var wmaci_link = null;
var wmaci_link_text = null;

// include documentation strings
<? require( 'wikiminiatlas_i18n.inc' ); ?>

var wikiminiatlas_tilesets = [
 {
  name: "Full basemap (VMAP0)",
  getTileURL: function( y, x, z ) 
  { 
   me = wikiminiatlas_tilesets[0];

   // rotating tile severs
   if( z >= 7 ) {
    return 'http://' + ( (x+y) % 16 ) + '.www.toolserver.org/~dschwen/wma/tiles/mapnik/' +
           z + '/' + y + '/tile_' + y + '_' + ( x % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png';
   } else {
    return 'http://' + ( (x+y) % 16 ) + '.www.toolserver.org/~dschwen/wma/tiles/mapnik/' +
           z + '/tile_' + y + '_' + ( x % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png';
   }
  },
  linkcolor: "#2255aa",
  maxzoom: 10,
  minzoom: 0
 },
 {
  name: "Physical",
  getTileURL: function( y, x, z ) {
   return wikiminiatlas_imgbase+'relief/' + z + '/' + y + '_' + ( x % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png'; 
  },
  linkcolor: "#2255aa",
  maxzoom: 5,
  minzoom: 0
 },
 {
  name: "Minimal basemap (coastlines)",
  getTileURL: function(y,x,z) {
   return wikiminiatlas_imgbase + 'plain/' + z + '/tile_' + y + '_' + ( x % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png';
  },
  linkcolor: "#2255aa",
  maxzoom: 7,
  minzoom: 0
 },
 {
  name: "Landsat",
  getTileURL: function(y,x,z) {
   var x1 = x % (wikiminiatlas_zoomsize[z]*2);
   if( x1<0 ) x1+=(wikiminiatlas_zoomsize[z]*2);
   return 'http://' + ( (x1+y) % 8 ) + '.www.toolserver.org/~dschwen/wma/tiles/mapnik/sat/' +
           z + '/' + y + '/' + y + '_' + ( x1 % ( wikiminiatlas_zoomsize[z] * 2 ) ) + '.png';
  },
  linkcolor: "white",
  maxzoom: 13,
  minzoom: 0
 },
 {
  name: "Daily aqua",
  getTileURL: function(y,x,z) {
   return wikiminiatlas_imgbase + 
    'satellite/sat2.php?x='+(x % (wikiminiatlas_zoomsize[z]*2) )+'&y='+y+'&z='+z+'&l=0'; 
  },
  linkcolor: "#aa0000",
  maxzoom: 7,
  minzoom: 0
 },
 {
  name: "Daily terra",
  getTileURL: function(y,x,z) { 
   return wikiminiatlas_imgbase + 
    'satellite/sat2.php?x='+(x % (wikiminiatlas_zoomsize[z]*2) )+'&y='+y+'&z='+z+'&l=1'; 
  },
  linkcolor: "#aa0000",
  maxzoom: 7,
  minzoom: 0
 },
 {
  name: "Moon (experimental!)",
  getTileURL: function(y,x,z) 
  { 
   var x1 = x % (wikiminiatlas_zoomsize[z]*2);
   if( x1<0 ) x1+=(wikiminiatlas_zoomsize[z]*2);

   return wikiminiatlas_imgbase + 'satellite/moon/'+z+'/'+y+'_'+x1+'.jpg'; 
  },
  linkcolor: "#aa0000",
  maxzoom: 7,
  minzoom: 0
 }
];
var wikiminiatlas_tileset = 0;

//
// Insert the map Widget into the page.
//
function wikiminiatlasInstall()
{
 var newcoords;
 if( wikiminiatlas_widget === null ) {

  //document.getElementById('debugbox').innerHTML='';

  var coord_params = (window.location.search).substr(1),
      synopsis_current = '';

  // parse coordinates
  var coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)/;
  if(coord_filter.test(coord_params))
  {
   coord_filter.exec(coord_params);
   marker.lat = parseFloat( RegExp.$1 );
   marker.lon = parseFloat( RegExp.$2 );
   wikiminiatlas_width = parseInt( RegExp.$3, 10 );
   wikiminiatlas_height= parseInt( RegExp.$4, 10 );

   coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)/;
   if( coord_filter.test(coord_params) ) {
    coord_filter.exec(coord_params);
    wikiminiatlas_site = RegExp.$5;
   }
   
   coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)_([\d]+)/;
   if( coord_filter.test(coord_params) ) {
    coord_filter.exec(coord_params);
    wikiminiatlas_defaultzoom = parseInt( RegExp.$6, 10 );
    wikiminiatlas_zoom = wikiminiatlas_defaultzoom;
   }

   coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)_([\d]+)_([a-z]+)/;
   if(coord_filter.test(coord_params)) {
    coord_filter.exec(coord_params);
    wikiminiatlas_language = RegExp.$7;
   }
   else {
    wikiminiatlas_language = wikiminiatlas_site;
   }

   coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)_([\d]+)_([a-z]+)_([\d+-.]+)_([\d+-.]+)/;
   if(coord_filter.test(coord_params))
   {
    newcoords = wmaLatLonToXY( RegExp.$8, RegExp.$9 );
    wikiminiatlas_marker_locked = false;
    wikiminiatlas_own_close = true;
   }
   else
   {
    newcoords = wmaLatLonToXY( marker.lat, marker.lon );
    wikiminiatlas_marker_locked = true;
   }

   wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
   wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
  }

  var WikiMiniAtlasHTML;
  UILang = wikiminiatlas_language;
  if( UILang == 'co' || UILang == 'commons' ) UILang = 'en';

  // Fill missing i18n items
  for( var item in strings )
   if( !strings[item][UILang] ) strings[item][UILang] = strings[item].en;

  WikiMiniAtlasHTML = 

   '<img id="button_plus" src="' + wikiminiatlas_imgbase + 
    'button_plus.png" title="' + strings.zoomIn[UILang] + '"' + 
    ' style="z-index:30; position:absolute; left:10px; top: 10px; width:18px; cursor:pointer">' +

   '<img id="button_minus" src="' + wikiminiatlas_imgbase + 
    'button_minus.png" title="' + strings.zoomOut[UILang] + '"' +
    ' style="z-index:30; position:absolute; left:10px; top: 32px; width:18px; cursor:pointer">' +

   '<img id="button_target" src="' + wikiminiatlas_imgbase + 
    'button_target_locked.png" title="' + strings.center[UILang] + '"' +
    ' style="z-index:30; position:absolute; left:10px; top: 54px; width:18px; cursor:pointer" onclick="wmaMoveToTarget()">' +

   '<img src="'+wikiminiatlas_imgbase+'button_menu.png" title="' + 
    strings.settings[UILang] + 
    '" style="z-index:50; position:absolute; right:40px; top: 8px; width:18px; cursor:pointer" onclick="toggleSettings()">';

  /*
    $('<img>').attr({ 
      src: wikiminiatlas_imgbase+'button_menu.png', 
    } ).css( {
      right: '40px', top: '8px', z-index: '50'
    } ).click(toggleSettings);
  */

  if( wikiminiatlas_own_close )
  {
   WikiMiniAtlasHTML += '<img src="'+wikiminiatlas_imgbase+'button_hide.png" title="' + 
    strings.close[UILang] + 
    '" style="z-index:50; position:absolute; right:18px; top: 8px; width:18px; cursor:pointer" onclick="window.close()">';
  }
  else
  {
   WikiMiniAtlasHTML += '<img src="'+wikiminiatlas_imgbase+'button_fs.png" title="' + 
    strings.fullscreen[UILang] + 
    '" style="z-index:50; position:absolute; right:62px; top: 8px; width:18px; cursor:pointer" onclick="wmaFullscreen()">';
  }

  WikiMiniAtlasHTML += '<a href="http://meta.wikimedia.org/wiki/WikiMiniAtlas/' + wikiminiatlas_language + 
   '" target="_top" style="z-index:11; position:absolute; bottom:3px; right: 10px; color:black; font-size:5pt">WikiMiniAtlas</a>';

  WikiMiniAtlasHTML += '<div id="wikiminiatlas_map" style="position:absolute; width:' + wikiminiatlas_width + 
   'px; height:' + wikiminiatlas_height + 'px; border: 1px solid gray; cursor: move; background-color: #aaaaaa; clip:rect(0px, ' + 
   wikiminiatlas_width + 'px, '+wikiminiatlas_height+'px, 0px);"></div>';
  
  // Scalebar
  WikiMiniAtlasHTML += 
   '<div id="scalebox"><div id="scalebar"></div>' +
   '<div id="scalelabel">null</div></div>';

  // Synopsis box
  WikiMiniAtlasHTML += '<div id="synopsis"><p id="synopsistext"></p></div>';
 
  // Settings page
  WikiMiniAtlasHTML += 
   '<div id="wikiminiatlas_settings">' +
   '<h4>' + strings.settings[UILang] + '</h4>' +
   '<p class="option">' + strings.mode[UILang] + ' <select onchange="wmaSelectTileset(this.value)">';
 
  for( var i = 0; i < wikiminiatlas_tilesets.length; i++ )
  {
   WikiMiniAtlasHTML +=
    '<option value="'+i+'">' + wikiminiatlas_tilesets[i].name + '</option>';
  }

  WikiMiniAtlasHTML +=
   '</select></p>' +
   '<p class="option">' + strings.labelSet[UILang] + ' <select onchange="wmaLabelSet(this.value)">';

  for( var i in wikiminiatlas_sites )
  {
   WikiMiniAtlasHTML +=
    '<option value="' + i + '"';

   if( i == wikiminiatlas_site ) 
    WikiMiniAtlasHTML += 'selected="selected"'; 

   WikiMiniAtlasHTML +=
    '>' + wikiminiatlas_sites[i] + '</option>';
  }

  WikiMiniAtlasHTML +=
   '</select></p>' +
   '<p class="option">' + strings.linkColor[UILang] + ' <select onchange="wmaLinkColor(this.value)">' +
   '<option value="#2255aa">'+ strings.blue[UILang ] +'</option>' +
   '<option value="red">'    + strings.red[UILang]   +'</option>' +
   '<option value="white">'  + strings.white[UILang] +'</option>' + 
   '<option value="black">'  + strings.black[UILang] +'</option></select></p>' +
   //'<p class="option" style="font-size: 50%; color:gray">Debug info:<br>marker: ' + typeof(marker.lat) + ', ' + marker.lon + '<br>site:'+wikiminiatlas_site+', uilang'+wikiminiatlas_language+'</p>' +
   '<a href="http://wiki.toolserver.org/" target="_top"><img src="http://toolserver.org/images/wikimedia-toolserver-button.png" border="0"></a>' +
   '</div>' +
   '</div>';

  wikiminiatlas_widget  = document.getElementById('wikiminiatlas_widget');
  wikiminiatlas_widget.innerHTML += WikiMiniAtlasHTML;

  var news = $('<div></div>').html('<b>New:</b> hold Ctrl or &#x2318; and hover over a link to read an article summary.').addClass('news');
  $('#wikiminiatlas_widget').append(news);
  news.click( function() { news.fadeOut(); } )
  setTimeout(  function() { news.fadeOut(); }, 20*1000 );

  scalelabel = document.getElementById('scalelabel');
  scalebar = document.getElementById('scalebar');

  wikiminiatlas_taget_button = document.getElementById('button_target');
  wikiminiatlas_settings = document.getElementById('wikiminiatlas_settings');
 
  $('#button_plus').bind('mousedown', wmaZoomIn );
  $('#button_minus').bind('mousedown', wmaZoomOut );

  //document.body.oncontextmenu = function() { return false; };
  $(document).keydown(wmaKeypress);
  $(document).bind('contextmenu', function() { return false; } );

  wikiminiatlas_old_onmouseup = document.onmouseup || null;
  wikiminiatlas_old_onmousemove = document.onmousemove || null;

  initializeWikiMiniAtlasMap();
  moveWikiMiniAtlasMapTo();
  wmaUpdateTargetButton();

  synopsis_filter = /http:\/\/([a-z-]+)\.wikipedia\.org\/wiki\/(.*)/;
  $('#wikiminiatlas_widget').mouseover( function(e){
    var l,t;
    if( e.metaKey ) {
      if( e.target.href && synopsis_filter.test(e.target.href) ) {
        l = RegExp.$1;
        t = RegExp.$2;
        $('#synopsistext').load( '/~dschwen/synopsis/?l=' + l + '&t=' + t, function() { 
          $('#synopsistext').find('a').attr('target','_top');
          $('#synopsis').fadeIn('slow');
          setTimeout( function() { 
            var h = $('#synopsistext').outerHeight(true),
                mh = wikiminiatlas_height/2;
            $('#synopsis').animate( { height: h<mh ? h : mh } ); 
          }, 500 );
        } );
      } else {
        $('#synopsis').fadeOut('fast');
      }
    }
  });
  $('#synopsis').click( function(e) { 
    if( e.target == this ) {
      $('#synopsis').fadeOut('fast'); 
    }
  } );

  // initialize message passing 
  if( window.postMessage ) {
    $(window).bind( 'message', wmaReceiveMessage );
    if( window != window.top ) {
      try {
        window.parent.postMessage( 'request', '*' );
      } catch(err) {
        // an error occurred, never mind, this is an optional feature
      }
    }
  }
 }
}

function toggleWikiMiniAtlas()
{
 if(wikiminiatlas_widget.style.visibility != "visible") {
   wikiminiatlas_widget.style.visibility="visible";
 } else {
   wikiminiatlas_widget.style.visibility="hidden";
 }
 return false;
}

function toggleSettings()
{
 if( wmaci_panel && wmaci_panel.style.visibility == 'visible' ) {
  wmaCommonsImageClose();
  return false; 
 }

 if( wikiminiatlas_settings.style.visibility != "visible" ) {
  wikiminiatlas_settings.style.visibility="visible";
 } else {
  wikiminiatlas_settings.style.visibility="hidden";
 }
 return false;
}

function initializeWikiMiniAtlasMap()
{
 if(wikiminiatlas_map === null)
 {
  $(document).mousemove(mouseMoveWikiMiniAtlasMap).mouseup(mouseUpWikiMiniAtlasMap);
  $('#wikiminiatlas_map').dblclick(wmaDblclick).mousedown(mouseDownWikiMiniAtlasMap);
  wikiminiatlas_map = document.getElementById('wikiminiatlas_map');

  wikiminiatlas_nx = Math.floor(wikiminiatlas_width/128)+2;
  wikiminiatlas_ny = Math.floor(wikiminiatlas_height/128)+2;
  wikiminiatlas_tile = new Array(wikiminiatlas_nx*wikiminiatlas_ny);

  var n = 0;
  var thistile;

  for(var j = 0; j < wikiminiatlas_ny; j++)
   for(var i = 0; i < wikiminiatlas_nx; i++)
   {
    wikiminiatlas_map.innerHTML += '<div id="wmatile'+n+'" style="position:absolute; width:128px; height:128px;"></div>';
    thistile = document.getElementById('wmatile'+n);
    thistile.onmousedown = mouseDownWikiMiniAtlasMap;
    n++;
   }

  wmaInitializeXMLHTTP();
  wmaInitializeXMLHTTPCallBacks();
  
  wikiminiatlas_map.innerHTML += '<div id="wmamarker"></div>';
  marker.obj = $('#wmamarker')[0];
 }
}

// Set new map Position (to wikiminiatlas_gx, wikiminiatlas_gy)
function moveWikiMiniAtlasMapTo()
{
 if(wikiminiatlas_gy<0) wikiminiatlas_gy=0;
 if(wikiminiatlas_gx<0) wikiminiatlas_gx+=Math.floor(wikiminiatlas_zoomsize[wikiminiatlas_zoom]*256);

 var lx = Math.floor(wikiminiatlas_gx/128) % wikiminiatlas_nx;
 var ly = Math.floor(wikiminiatlas_gy/128) % wikiminiatlas_ny;
 var fx = wikiminiatlas_gx % 128;
 var fy = wikiminiatlas_gy % 128;
 var n;
 var thistile;
 var tileurl;
 var dataurl;

 wmaUpdateScalebar();
 //document.getElementById('debugbox').innerHTML='';

 for(var j = 0; j < wikiminiatlas_ny; j++)
  for(var i = 0; i < wikiminiatlas_nx; i++)
  {
   n = ((i+lx) % wikiminiatlas_nx) + ((j+ly) % wikiminiatlas_ny)*wikiminiatlas_nx;

   thistile = document.getElementById('wmatile'+n);
   thistile.style.left = (i*128-fx) + 'px';
   thistile.style.top  = (j*128-fy) + 'px';

   //thistile.innerHTML = (Math.floor(wikiminiatlas_gx/128)+i)+','+(Math.floor(wikiminiatlas_gy/128)+j);
   tileurl = 'url("' + 
    wikiminiatlas_tilesets[wikiminiatlas_tileset].getTileURL((Math.floor(wikiminiatlas_gy/128)+j),(Math.floor(wikiminiatlas_gx/128)+i),wikiminiatlas_zoom) + '")';
   dataurl = wmaGetDataURL((Math.floor(wikiminiatlas_gy/128)+j),(Math.floor(wikiminiatlas_gx/128)+i),wikiminiatlas_zoom);

   if( wikiminiatlas_tile[n]!=tileurl )
   {
    wikiminiatlas_tile[n] = tileurl;
    thistile.style.backgroundImage=tileurl;

    if( wikiminiatlas_xmlhttp[n] &&
     ( wikiminiatlas_xmlhttp[n].readyState == 2 ||
       wikiminiatlas_xmlhttp[n].readyState == 3 ) )
    {
     wikiminiatlas_xmlhttp[n].onreadystatechange = function() {};
     wikiminiatlas_xmlhttp[n].abort();
    }

    wikiminiatlas_xmlhttp[n].open("GET", dataurl,true);
    thistile.innerHTML='<span class="loading">' + strings.labelLoading[UILang] + '</span>';
    wikiminiatlas_xmlhttp[n].onreadystatechange=wikiminiatlas_xmlhttp_callback[n];
    wikiminiatlas_xmlhttp[n].send(null);
   }

  }

  // update markers
  updateMarker(marker);
  for( n = 0; n < extramarkers.length; ++n ) {
   updateMarker(extramarkers[n]);
  }
}

// position marker
function updateMarker(m) {
 var newcoords = wmaLatLonToXY( m.lat, m.lon );
 var newx = ( newcoords.x - wikiminiatlas_gx );
 if( newx < -100 ) newx += ( wikiminiatlas_zoomsize[wikiminiatlas_zoom] * 256 );
 m.obj.style.left = (newx-6)+'px';
 m.obj.style.top  = (newcoords.y-wikiminiatlas_gy-6)+'px';
}

// Mouse down handler (start map-drag)
function mouseDownWikiMiniAtlasMap(ev)
{
 ev = ev || window.event;
 wikiminiatlas_dragging = wmaMouseCoords(ev);
}

// Mouse up handler (finish map-drag)
function mouseUpWikiMiniAtlasMap()
{
 wikiminiatlas_dragging = null;
 if( wikiminiatlas_old_onmouseup !== null ) wikiminiatlas_old_onmouseup();
}

// Mouse move handler
function mouseMoveWikiMiniAtlasMap(ev)
{
 window.scrollTo(0,0);
 if( wikiminiatlas_dragging !== null )
 {
  var newev = ev || window.event;
  var newcoords = wmaMouseCoords(newev);

  wikiminiatlas_gx -= ( newcoords.x - wikiminiatlas_dragging.x );
  wikiminiatlas_gy -= ( newcoords.y - wikiminiatlas_dragging.y );
  wikiminiatlas_dragging = newcoords;

  moveWikiMiniAtlasMapTo();

  if( wikiminiatlas_marker_locked )
  {
   wikiminiatlas_marker_locked = false;
   wmaUpdateTargetButton();
  }
 }

 if( wikiminiatlas_old_onmousemove !== null ) wikiminiatlas_old_onmousemove(ev); 
}

function wmaDblclick(ev)
{
 ev = ev || window.event;
 var test = wmaMouseCoords(ev);

 wikiminiatlas_gx += test.x - wikiminiatlas_width/2;
 wikiminiatlas_gy += test.y - wikiminiatlas_height/2;

 if( wikiminiatlas_marker_locked )
 {
  wikiminiatlas_marker_locked = false;
  wmaUpdateTargetButton();
 }

 moveWikiMiniAtlasMapTo();
 return false;
}

function wmaKeypress(ev)
{
 ev = ev || window.event;
 switch( ev.keyCode || ev.which )
 {
  case 37 : wikiminiatlas_gx -= wikiminiatlas_width/2; break; 
  case 38 : wikiminiatlas_gy -= wikiminiatlas_height/2; break; 
  case 39 : wikiminiatlas_gx += wikiminiatlas_width/2; break; 
  case 40 : wikiminiatlas_gy += wikiminiatlas_height/2; break; 
 }

 if( wikiminiatlas_marker_locked )
 {
  wikiminiatlas_marker_locked = false;
  wmaUpdateTargetButton();
 }

 moveWikiMiniAtlasMapTo();
 return false;
}

function wmaMouseCoords(ev)
{
 if(ev.pageX || ev.pageY)
 {
  return {x:ev.pageX, y:ev.pageY};
 }
 return {
  x:ev.clientX + document.body.scrollLeft - document.body.clientLeft,
  y:ev.clientY + document.body.scrollTop  - document.body.clientTop
 };
}

function wmaGetDataURL(y,x,z)
{
 return wikiminiatlas_database + wikiminiatlas_site + '_' + (wikiminiatlas_zoomsize[z]-y-1) + '_' + (x % (wikiminiatlas_zoomsize[z]*2) ) + '_' + z;
 //return 'http://' +  ( ( 8*x + y ) % 16 + 16 ) + '.www.toolserver.org/wma/label/' + wikiminiatlas_site + '_' + (wikiminiatlas_zoomsize[z]-y-1) + '_' + (x % (wikiminiatlas_zoomsize[z]*2) ) + '_' + z;
}

function tilesetUpgrade()
{
 for( var i = wikiminiatlas_tileset+1; i < wikiminiatlas_tilesets.length; i++ )
 {
  if( wikiminiatlas_tilesets[i].maxzoom > (wikiminiatlas_zoom+1) )
  {
   wikiminiatlas_tileset = i;
   wikiminiatlas_zoom++;
   return;
  }
 }
}

function tilesetDowngrade()
{
 for( var i = wikiminiatlas_tileset-1; i >= 0; i-- )
 {
  if( wikiminiatlas_tilesets[i].minzoom < (wikiminiatlas_zoom-1) )
  {
   wikiminiatlas_tileset = i;
   wikiminiatlas_zoom--;
   return;
  }
 }
}

function wmaZoomIn( ev )
{
 var mapcenter = wmaXYToLatLon(wikiminiatlas_gx+wikiminiatlas_width/2,wikiminiatlas_gy+wikiminiatlas_height/2);
 var rightclick = false;

 if(!ev) var ev = window.event;
 if(ev) {
  if (ev.which) rightclick = (ev.which == 3);
  else if (ev.button) rightclick = (ev.button == 2);
 } 

 if( rightclick )
 {
  wikiminiatlas_zoom = wikiminiatlas_tilesets[wikiminiatlas_tileset].maxzoom;
 }
 else
 {
  if( wikiminiatlas_zoom >= wikiminiatlas_tilesets[wikiminiatlas_tileset].maxzoom )
  {
   tilesetUpgrade();
  }
  else wikiminiatlas_zoom++;
 }

 var newcoords;

 if( wikiminiatlas_marker_locked )
  newcoords = wmaLatLonToXY( marker.lat, marker.lon );
 else
  newcoords = wmaLatLonToXY( mapcenter.lat, mapcenter.lon );

 wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
 wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
 moveWikiMiniAtlasMapTo();

 return false;
}

function wmaZoomOut( e )
{
 var mapcenter = wmaXYToLatLon(wikiminiatlas_gx+wikiminiatlas_width/2,wikiminiatlas_gy+wikiminiatlas_height/2);
 var rightclick = false;

 if(!ev) var ev = window.event;
 if(ev) {
  if (ev.which) rightclick = (ev.which == 3);
  else if (ev.button) rightclick = (ev.button == 2);
 }

 if( rightclick ) {
  wikiminiatlas_zoom = wikiminiatlas_tilesets[wikiminiatlas_tileset].minzoom;
 } else {
  if( wikiminiatlas_zoom <= wikiminiatlas_tilesets[wikiminiatlas_tileset].minzoom ) {
   tilesetDowngrade();
  } 
  else wikiminiatlas_zoom--;
 }

 var newcoords = wmaLatLonToXY(mapcenter.lat,mapcenter.lon);
 wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
 wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
 moveWikiMiniAtlasMapTo();

 return false;
}

function wmaSelectTileset( n )
{
 var newz = wikiminiatlas_zoom;

 if( newz > wikiminiatlas_tilesets[n].maxzoom ) newz = wikiminiatlas_tilesets[n].maxzoom;
 if( newz < wikiminiatlas_tilesets[n].minzoom ) newz = wikiminiatlas_tilesets[n].minzoom;
 
 wikiminiatlas_tileset = n;

 if( wikiminiatlas_zoom != newz ) {
  var mapcenter = wmaXYToLatLon(wikiminiatlas_gx+wikiminiatlas_width/2,wikiminiatlas_gy+wikiminiatlas_height/2);
  wikiminiatlas_zoom = newz;
  var newcoords = wmaLatLonToXY(mapcenter.lat,mapcenter.lon);
  wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
  wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
 }
  
 moveWikiMiniAtlasMapTo();
 toggleSettings();
}

function wmaLinkColor(c)
{
 document.styleSheets[0].cssRules[0].style.color = c;
 toggleSettings();
 return false;
}

function wmaLabelSet(s)
{
 wikiminiatlas_site = s;
 for( var n = 0; n < wikiminiatlas_nx * wikiminiatlas_ny; n++) {
   wikiminiatlas_tile[n]='';
 }
 moveWikiMiniAtlasMapTo();
 toggleSettings();
 return false;
}

function wmaUpdateScalebar()
{
 var sblocation = wmaXYToLatLon(wikiminiatlas_gx+wikiminiatlas_width/2,wikiminiatlas_gy+wikiminiatlas_height/2);
 var slen1 = 50, slen2;
 var skm1,skm2;
 skm1 = Math.cos(sblocation.lat*0.0174532778)*circ_eq*slen1/(256*wikiminiatlas_zoomsize[wikiminiatlas_zoom]);
 skm2 = Math.pow(10,Math.floor(Math.log(skm1)/Math.log(10)));
 slen2 = slen1*skm2/skm1;
 if( 5*slen2 < slen1 ) { slen2=slen2*5; skm2=skm2*5; }
 if( 2*slen2 < slen1 ) { slen2=slen2*2; skm2=skm2*2; }
 scalelabel.innerHTML = skm2 + ' km';
 scalebar.style.width = slen2;
}

function wmaUpdateTargetButton()
{
 if( wikiminiatlas_marker_locked ) {
  wikiminiatlas_taget_button.src = wikiminiatlas_imgbase + 'button_target_locked.png';
 } else {
  wikiminiatlas_taget_button.src = wikiminiatlas_imgbase + 'button_target.png';
 }
}

function wmaMoveToCoord( lat, lon )
{
 var newcoords = wmaLatLonToXY( lat, lon );
 wikiminiatlas_gx = newcoords.x-wikiminiatlas_width/2;
 wikiminiatlas_gy = newcoords.y-wikiminiatlas_height/2;
 moveWikiMiniAtlasMapTo();
}

function wmaMoveToTarget() {
 wmaMoveToCoord( marker.lat, marker.lon );
 wikiminiatlas_marker_locked = true;
 wmaUpdateTargetButton();
}

function wmaLatLonToXY(lat,lon) {
 var newx = Math.floor( (lon/360.0) * wikiminiatlas_zoomsize[wikiminiatlas_zoom]*256 );
 if( newx < 0 ) {
  newx += wikiminiatlas_zoomsize[wikiminiatlas_zoom]*256;
 }
 return { y:Math.floor((0.5-lat/180.0)*wikiminiatlas_zoomsize[wikiminiatlas_zoom]*128), x:newx };
}

function wmaXYToLatLon(x,y) {
 return { lat:180.0*(0.5-y/(wikiminiatlas_zoomsize[wikiminiatlas_zoom]*128)), lon:360.0*(x/(wikiminiatlas_zoomsize[wikiminiatlas_zoom]*256)) };
}

// Try to create an XMLHTTP request object for each tile with maximum browser compat.
// code adapted from http://jibbering.com/2002/4/httprequest.html
function wmaInitializeXMLHTTP()
{
 var i;
 var n_total = wikiminiatlas_nx*wikiminiatlas_ny;


 /*@cc_on @*/
 /*@if (@_jscript_version >= 5)
 // Internet Explorer (uses Conditional compilation)
 // traps security blocked creation of the objects.
  wmaDebug('Microsoft section');
  try {
   wikiminiatlas_xmlhttp = new Array(n_total);
   for(i=0; i< n_total; i++) wikiminiatlas_xmlhttp[i] = new ActiveXObject("Msxml2.XMLHTTP");
   wmaDebug('* Msxml2.XMLHTTP success');
  } catch (e) {
   try {
    for(i=0; i< n_total; i++) wikiminiatlas_xmlhttp[i] = new ActiveXObject("Microsoft.XMLHTTP");
    wmaDebug('* Microsoft.XMLHTTP success');
   } catch (E) {
    wikiminiatlas_xmlhttp = false;
   }
  }
 @end @*/

 // Firefox, Konqueror, Safari, Mozilla
 wmaDebug('Firefox/Konqueror section');
 if (!wikiminiatlas_xmlhttp && typeof XMLHttpRequest!='undefined') {
  try {
   wikiminiatlas_xmlhttp = new Array(n_total);
   for(i=0; i< n_total; i++) wikiminiatlas_xmlhttp[i] = new XMLHttpRequest();
   wmaDebug('* XMLHttpRequest success');
  } catch (e) {
   wikiminiatlas_xmlhttp=false;
  }
 }

 // ICE browser
 wmaDebug('ICE section');
 if (!wikiminiatlas_xmlhttp && window.createRequest) {
  try {
   wikiminiatlas_xmlhttp = new Array(n_total);
   for(i=0; i< n_total; i++) wikiminiatlas_xmlhttp[i] = new window.createRequest();
   wmaDebug('* window.createRequest success');
  } catch (e) {
   wikiminiatlas_xmlhttp=false;
  }
 }
}

// return a callback function for tile i using a closure
function wmaBuildCallback(i) {
 return function() {
  if( wikiminiatlas_xmlhttp[i].readyState == 4 &&
      wikiminiatlas_xmlhttp[i].status == 200 ) { 
    document.getElementById('wmatile'+i).innerHTML = wikiminiatlas_xmlhttp[i].responseText; 
  }
 }
}

// Every tile needs a callback function for its xmlhttprequest
// Build them all
function wmaInitializeXMLHTTPCallBacks()
{
 var i, n_total = wikiminiatlas_nx * wikiminiatlas_ny;
 wikiminiatlas_xmlhttp_callback = new Array(n_total);
 for(i=0; i< n_total; i++) {
  wikiminiatlas_xmlhttp_callback[i] = wmaBuildCallback(i);
 }
}

function wmaDebug(text)
{
 //document.getElementById('debugbox').innerHTML+=text+'<br />';
}

function wmaCommonsImageClose()
{
 wmaci_panel.style.visibility = 'hidden';
}

function wmaCommonsImageBuild()
{
 wmaci_panel = document.createElement('DIV');
 wmaci_panel.id = 'wikiminiatlas_wmaci_panel';

 var wmaci_panel_sub = document.createElement('DIV');
 wmaci_panel_sub.id = 'wikiminiatlas_wmaci_panel_sub';
 wmaci_panel.appendChild( wmaci_panel_sub );

 wmaci_image_span = document.createElement('SPAN');
 wmaci_image = document.createElement('IMG');
 wmaci_image_span.appendChild( wmaci_image );
 wmaci_panel_sub.appendChild( wmaci_image_span );

 wmaci_panel_sub.appendChild( document.createElement('BR') ); 

 wmaci_link = document.createElement('A');
 wmaci_link.id = 'wikiminiatlas_wmaci_link';
 wmaci_link_text = document.createTextNode('');
 wmaci_link.appendChild( wmaci_link_text );
 wmaci_panel_sub.appendChild( wmaci_link );

 wikiminiatlas_widget.appendChild( wmaci_panel );
}

function wmaCommonsImage( name, w, h )
{
 if( wmaci_panel == null ) {
   wmaCommonsImageBuild();
 }
 var maxw = wikiminiatlas_width - 30;
 var maxh = wikiminiatlas_height - 80;
 var imgw = w;
 var imgh = h;

 if( imgw > maxw ) {
  imgh = Math.round( ( imgh * maxw ) / imgw );
  imgw = maxw;
 }
 if( imgh > maxh ) {
  imgw = Math.round( ( imgw * maxh ) / imgh );
  imgh = maxh;
 }

 // rebuild element to avoid old pic showing up
 wmaci_image_span.removeChild( wmaci_image );
 wmaci_image = document.createElement('IMG');
 wmaci_image.onclick = wmaCommonsImageClose;
 wmaci_image.id = 'wikiminiatlas_wmaci_image';
 wmaci_image.title = 'click to close';
 wmaci_image_span.appendChild( wmaci_image );

 if( imgw < w )
  wmaci_image.src = 'http://commons.wikimedia.org/w/thumb.php?w=' + imgw + '&f=' + name;
 else
  wmaci_image.src = 'http://commons.wikimedia.org/wiki/Special:FilePath/' + name;

 wmaci_link.href = 'http://commons.wikimedia.org/wiki/Image:' + name;
 wmaci_link_text.nodeValue = '[[:commons:Image:' + name + ']]';

 wmaci_panel.style.visibility = 'visible';
}

function wmaFullscreen() {
 var fs = window.open('', 'showwin', 'left=0,top=0,width=' + screen.width + ',height=' + screen.height + ',toolbar=0,resizable=0,fullscreen=1');
 var w, h;

 if ( fs.innerWidth ) {
  w = fs.innerWidth;
  h = fs.innerHeight;
 }
 else if ( fs.document.body.offsetWidth ) {
  w = fs.document.body.offsetWidth;
  h = fs.document.body.offsetHeight;
 }

 var mapcenter = wmaXYToLatLon( wikiminiatlas_gx + wikiminiatlas_width / 2, wikiminiatlas_gy + wikiminiatlas_height / 2 );

 fs.document.location = 'iframe.html' + '?' + marker.lat + '_' + marker.lon + '_' + w + '_' + h + '_' + 
   wikiminiatlas_site + '_' + wikiminiatlas_zoom + '_' + wikiminiatlas_language + '_' + mapcenter.lat + '_' + mapcenter.lon;
}

// mouse over handler for extra markers
function extraMarkerMessage(index,cmd) {
 return function(e) {
  window.parent.postMessage( cmd + ',' + index, '*' );
 }
}

function wmaReceiveMessage(e) {
 e = e.originalEvent;
 var d = e.data.split(','),
     title = decodeURIComponent( d.splice(3).join(',') ).replace(/\+/g,' '),
     m = { obj: null, lat: parseFloat(d[0]), lon: parseFloat(d[1]) },
     i;

 if( Math.abs(m.lat-marker.lat) > 0.0001 || Math.abs(m.lon-marker.lon) > 0.0001 ) {
  i = $('<div class="emarker"></div>').attr('title',title);
  i.mouseover(extraMarkerMessage(parseInt(d[2]),'highlight'));
  i.mouseout(extraMarkerMessage(parseInt(d[2]),'unhighlight'));
  i.click(extraMarkerMessage(parseInt(d[2]),'scroll'));
  m.obj = i[0];
  $(wikiminiatlas_map).append(i);
  updateMarker(m);
  extramarkers.push(m);
 }
}

// call installation routine
$(function(){
  wikiminiatlasInstall();
});
