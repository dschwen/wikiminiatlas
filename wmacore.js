var wma_highzoom_activated = true;
var wma_highzoom_purge = false;
var wma_bldg3dzoom = 14;
var bldg3d = null, bldg3dc = null, bldg3dtimer = null; // move to appropriate scope
var update3dBuildings;
var credit; // move to appropriate scope
var wmaNews = []; // array of news item actions (needs to be global)


// global settings
var wma_imgbase = 'tiles/';
var wma_database = 'label.php';
var wma_tilebase = '.www.toolserver.org/~dschwen/wma/tiles/';
var wma_maxlabel = 13;
var i, wma_zoomsize = [3];
for(i=1; i<40; i++) { wma_zoomsize[i]=2*wma_zoomsize[i-1]; }

// label cache (formerly sessionStorage)
var lc = {};

var wma_tilesets = [
 {
  name: "mapFull", //"Full basemap (VMAP0,OSM)",
  globe: "Earth",
  //credit: ' / <a href="http://www.openstreetmap.org" title="Map data © OpenStreetMap contributors, CC BY-SA">OpenStreetMap</a>',
  credit: ' / Map data © <a href="http://www.openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://www.opendatacommons.org/licenses/odbl">License</a>',
  getTileURL: function( y, x, z, norot ) 
  { 
   me = wma_tilesets[0];

   // rotating tile severs (yes/no)
   if( norot  || document.location.protocol=='https:' ) {
     if( z >= 7 ) {
      return wma_imgbase + 'mapnik/' +
             z + '/' + y + '/tile_' + y + '_' + ( x % ( wma_zoomsize[z] * 2 ) ) + '.png';
     } else {
      return wma_imgbase + 'mapnik/' +
             z + '/tile_' + y + '_' + ( x % ( wma_zoomsize[z] * 2 ) ) + '.png';
     }
   } else {
     if( z >= 7 ) {
      return '//' + ( (x+y) % 16 ) + wma_tilebase + 'mapnik/' +
             z + '/' + y + '/tile_' + y + '_' + ( x % ( wma_zoomsize[z] * 2 ) ) + '.png';
     } else {
      return '//' + ( (x+y) % 16 ) + wma_tilebase + 'mapnik/' +
             z + '/tile_' + y + '_' + ( x % ( wma_zoomsize[z] * 2 ) ) + '.png';
     }
   }
  },
  linkcolor: [ "#2255aa", "1px 0px 2px white, 0px -1px 2px white,0px 1px 2px white,-1px 0px 2px white" ],
  equator: 40075.0, // equatorial circumfence in km
  maxzoom: 20,
  minzoom: 0
 },
 {
  name: "mapPhysical",
  globe: "Earth",
  getTileURL: function( y, x, z ) {
   return wma_imgbase+'relief/' + z + '/' + y + '_' + ( x % ( wma_zoomsize[z] * 2 ) ) + '.png'; 
  },
  linkcolor: [ "#2255aa", "white 0pt 0pt 2pt" ],
  equator: 40075.0, // equatorial circumfence in km
  maxzoom: 5,
  minzoom: 0
 },
 {
  name: "mapLandsat",
  globe: "Earth",
  getTileURL: function(y,x,z, norot) {
   var x1 = x % (wma_zoomsize[z]*2);
   if( x1<0 ) x1+=(wma_zoomsize[z]*2);
   if( norot || document.location.protocol=='https:' ) {
    return wma_imgbase + 'mapnik/sat/' +
             z + '/' + y + '/' + y + '_' + ( x1 % ( wma_zoomsize[z] * 2 ) ) + '.png';
   } else {
    return '//' + ( (x1+y) % 8 ) + wma_tilebase + 'mapnik/sat/' +
             z + '/' + y + '/' + y + '_' + ( x1 % ( wma_zoomsize[z] * 2 ) ) + '.png';
   }
  },
  linkcolor: [ "white", "black 0pt 0pt 2pt" ],
  equator: 40075.0, // equatorial circumfence in km
  maxzoom: 13,
  minzoom: 0
 },
 {
  name: "mapCoastline", //"Minimal basemap (coastlines)",
  globe: "Earth",
  getTileURL: function(y,x,z) {
   return wma_imgbase + 'plain/' + z + '/tile_' + y + '_' + ( x % ( wma_zoomsize[z] * 2 ) ) + '.png';
  },
  linkcolor: [ "#2255aa", "1px 0px 2px white, 0px -1px 2px white,0px 1px 2px white,-1px 0px 2px white" ],
  equator: 40075.0, // equatorial circumfence in km
  maxzoom: 7,
  minzoom: 0
 },
 /*{
  name: "Daily aqua",
  getTileURL: function(y,x,z) {
   return wma_imgbase + 
    'satellite/sat2.php?x='+(x % (wma_zoomsize[z]*2) )+'&y='+y+'&z='+z+'&l=0'; 
  },
  linkcolor: "#aa0000",
  maxzoom: 7,
  minzoom: 0
 },
 {
  name: "Daily terra",
  getTileURL: function(y,x,z) { 
   return wma_imgbase + 
    'satellite/sat2.php?x='+(x % (wma_zoomsize[z]*2) )+'&y='+y+'&z='+z+'&l=1'; 
  },
  linkcolor: "#aa0000",
  maxzoom: 7,
  minzoom: 0
 },*/
 {
  name: "mapPhysical",
  globe: "Moon",
  getTileURL: function(y,x,z) 
  { 
   var x1 = x % (wma_zoomsize[z]*2);
   if( x1<0 ) x1+=(wma_zoomsize[z]*2);

   return wma_imgbase + 'lro_moon/lromoon_'+('00'+(5-z))+'_'+('000'+x1).substr(-3)+'_'+('000'+y).substr(-3)+'.png'; 
  },
  linkcolor: [ "black", "1px 0px 2px white, 0px -1px 2px white,0px 1px 2px white,-1px 0px 2px white" ],
  equator: 10940.475, // equatorial circumfence in km
  maxzoom: 5,
  minzoom: 0
 },
 {
  name: "mapLandsat",
  globe: "Moon",
  getTileURL: function(y,x,z) 
  { 
   var x1 = x % (wma_zoomsize[z]*2);
   if( x1<0 ) x1+=(wma_zoomsize[z]*2);

   return wma_imgbase + 'moon/'+z+'/'+y+'_'+x1+'.jpg'; 
  },
  linkcolor: [ "white", "1px 0px 2px black, 0px -1px 2px black,0px 1px 2px black,-1px 0px 2px black" ],
  equator: 10940.475, // equatorial circumfence in km
  maxzoom: 7,
  minzoom: 0
 },
 {
  name: "mapLandsat",
  globe: "Mars",
  getTileURL: function(y,x,z) 
  { 
   var x1 = (x+wma_zoomsize[z]) % (wma_zoomsize[z]*2);
   if( x1<0 ) x1+=(wma_zoomsize[z]*2);

   return wma_imgbase + 'mars/mars_'+('00'+(5-z))+'_'+('000'+x1).substr(-3)+'_'+('000'+y).substr(-3)+'.png'; 
  },
  linkcolor: [ "white", "black 0pt 0pt 2pt" ],
  equator: 21359.975, // equatorial circumfence in km
  maxzoom: 5,
  minzoom: 0
 },
 {
  name: "mapPhysical",
  globe: "Venus",
  getTileURL: function(y,x,z) 
  { 
   var x1 = x % (wma_zoomsize[z]*2);
   if( x1<0 ) x1+=(wma_zoomsize[z]*2);

   return wma_imgbase + 'venus/venus_'+('00'+(3-z))+'_'+('000'+x1).substr(-3)+'_'+('000'+y).substr(-3)+'.png'; 
  },
  linkcolor: [ "white", "1px 0px 2px black, 0px -1px 2px black,0px 1px 2px black,-1px 0px 2px black" ],
  equator: 38024.6, // equatorial circumfence in km
  maxzoom: 3,
  minzoom: 0
 },
 {
  name: "mapLandsat",
  globe: "Mercury",
  getTileURL: function(y,x,z) 
  { 
   var x1 = (x+1*wma_zoomsize[z]) % (wma_zoomsize[z]*2);
   if( x1<0 ) x1+=(wma_zoomsize[z]*2);
   var z1 = 6-z;
   return wma_imgbase + 'mercury/'+((z1<3)?(z1+'/'):'')+((z1==0)?(Math.floor(x1/100)+'/'):'')+'merc_'+('00'+z1)+'_'+('000'+x1).substr(-3)+'_'+('000'+y).substr(-3)+'.png'; 
  },
  linkcolor: [ "white", "1px 0px 2px black, 0px -1px 2px black,0px 1px 2px black,-1px 0px 2px black" ],
  equator: 15329.1, // equatorial circumfence in km
  maxzoom: 6,
  minzoom: 0
 },
 {
  name: "mapLandsat",
  globe: "Io",
  getTileURL: function(y,x,z) 
  { 
   var x1 = (x+wma_zoomsize[z]) % (wma_zoomsize[z]*2);
   if( x1<0 ) x1+=(wma_zoomsize[z]*2);

   return wma_imgbase + 'io/io_'+('00'+(4-z))+'_'+('000'+x1).substr(-3)+'_'+('000'+y).substr(-3)+'.png'; 
  },
  linkcolor: [ "black", "1px 0px 2px white, 0px -1px 2px white,0px 1px 2px white,-1px 0px 2px white" ],
  equator: 11443.6, // equatorial circumfence in km
  maxzoom: 4,
  minzoom: 0
 },
 {
  name: "mapLandsat",
  globe: "Titan",
  getTileURL: function(y,x,z) 
  { 
   var x1 = x % (wma_zoomsize[z]*2);
   if( x1<0 ) x1+=(wma_zoomsize[z]*2);

   return wma_imgbase + 'titan/titan_'+('00'+(3-z))+'_'+('000'+x1).substr(-3)+'_'+('000'+y).substr(-3)+'.png'; 
  },
  linkcolor: [ "black", "1px 0px 2px white, 0px -1px 2px white,0px 1px 2px white,-1px 0px 2px white" ],
  equator: 16190.3, // equatorial circumfence in km
  maxzoom: 3,
  minzoom: 0
 }
];

// parse url parameters into a hash
function parseParams(url) {
  var map = {}, h, i, pair = url.substr(url.indexOf('?')+1).split('&');
  for( i=0; i<pair.length; ++i ) {
    h = pair[i].split('=');
    map[h[0]] = h[1];
  }
  return map;
}

// check if a language given by language code lang is right to left (RTL)
function isRTL(lang) {
  return ( $.inArray( lang, ['ar','he','fa'] ) >= 0 );
}

//
// Insert the map Widget into the page.
//
function wikiminiatlasInstall( wma_widget, url_params ) {
  // defaults
  var wma_coordinate_region = '';
  var wma_width = 500;
  var wma_height = 300;
  // globals
  var wma_map = null;
  var wma_own_close = false;
  var wma_nx;
  var wma_ny;
  var wma_tile;
  var wma_tileurl = [];
  var wma_dragging = null;
  var wma_mdcoord = { x: -1, y: -1 };
  var wma_gx = 0;
  var wma_gy = 0;
  var wma_zoom = 1;
  var wma_defaultzoom = 0;
  var marker = { obj: null, lat: 0, lon: 0 };
  var extramarkers = [];
  var wma_marker_locked = true;
  var wma_taget_button = null;
  var wma_settings = null;
  var wma_xmlhttp = false;
  var wma_xmlhttp_callback = false;
  var wma_language = 'de';
  var wma_site = '';
  var UILang = 'en';
  var UIrtl = false;

  // this block of variables is set by setTileSet
  var wma_tileset = 0;
  var tsx = 128, tsy = 128; // tile size

  var scalelabel = null;
  var scalebar = null;
  var globe = null;

  var synopsis = null;
  var synopsis_filter = null;
  var synopsistext = null;

  var wmaci = {
    shown: false,
    panel: null,
    image: null,
    link: null
  };

  url_params = url_params || parseParams(window.location.href);
  var wmasize = {}, wmakml = { shown: false, drawn: false, canvas: null, c: null, ways: null, areas: null, maxlat: -Infinity, minlat: Infinity };

  var wmaLinkStyle = {};

  var wmaGlobe = false;
  var wmaGlobeLoadTiles = null;

  var hasCanvas = "HTMLCanvasElement" in window;

  var labelcaption, noticehandler = null;

  function setupWidget()
  {
    var newcoords;

    // parse parameters
    var coord_params = url_params['wma'] || (window.location.search).substr(1)
      , page = url_params['page']
      , lang = url_params['lang']
      , synopsis_current = '';

    globe = url_params['globe'] || "Earth"

    // launch the WIWOSM request (if a page was passed)
    if( page && hasCanvas ) {
      $.ajax({
        url: '//toolserver.org/~master/osmjson/getGeoJSON.php?lang='+lang+'&article='+page,
        dataType: 'json',
        success: processWIWOSM
      });
    }

    // GeoIP request (sets global variable geoip)
    $.getScript( '/~para/geoip.fcgi', function() {
      // modify home button
    } );

    // setup the globe
    wmaGlobeLoadTiles = (function(){
      if( !hasCanvas ) { return function(){}; }

      var map = $('<canvas></canvas>').attr( { width: 6*128*4/3, height: 3*128*4/3 } ).css( { display: 'none' } ),
          tmap = $('<canvas></canvas>').attr( { width: 6*128, height: 3*128 } ).css( { display: 'none' } ),
          omap = $('<canvas></canvas>').attr( { width: 6*128, height: 3*128 } ).css( { display: 'none' } ),
          shadow =  $('<div></div>')
            .css( { position: 'absolute', 
                    width: '80px', height: '80px', bottom: '20px', right: '5px', 
                    zIndex: 50, display: 'none', 
                    borderRadius: '40px', '-moz-border-radius': '40px', 
                    boxShadow:'5px 5px 25px rgba(0,0,0,0.3)' } ),
          globe = $('<canvas></canvas>')
            .attr( { width: 160, height: 160 } )
            .css( { position: 'absolute', width: '80px', height: '80px', bottom: '20px', right: '5px', zIndex: 51, display: 'none' } );

      // load map tiles
      function loadTiles() {
        var i,j, loadcount=0, c = tmap[0].getContext('2d'), cm = map[0].getContext('2d');
        c.clearRect(0,0,6*128,3*128);
        for( i=0; i<6; ++i ) {
          for( j=0; j<3; ++j ) {
            (function(x,y){
              var img = new Image;
              $(img).load(function(){
                c.drawImage(img,x*128,y*128);
                loadcount++;
                if( loadcount == 3*6 ) {
                  cm.drawImage(tmap[0],0,0,6*128*4/3,3*128*4/3);
                  // first globe initialization
                  if( !wmaGlobe ) {
                    wmaGlobe = wmaGlobe3d(globe[0],map[0]);
                    if( !wmaGlobe ) { return };
                    wmaGlobe.setLatLon(marker.lat,marker.lon);
                    shadow.fadeIn(200);
                    globe.fadeIn(200);
                    // attach canvas objects
                    wmaGlobe.mapContext = cm;
                    wmaGlobe.tmap = tmap[0]; // map original
                    wmaGlobe.tmapContext = c; 
                    wmaGlobe.omap = omap[0]; // overlay buffer
                    wmaGlobe.omapContext = omap[0].getContext('2d');

                    wmaGlobe.updateTiles = function() {
                      wmaGlobe.mapContext.clearRect(0,0,6*128*4/3,3*128*4/3);
                      wmaGlobe.mapContext.drawImage(wmaGlobe.tmap,0,0,6*128*4/3,3*128*4/3);
                      wmaGlobe.updateTexture();
                      wmaGlobe.draw();
                    }
                    wmaGlobe.updateKML = function() {
                      wmaGlobe.mapContext.clearRect(0,0,6*128*4/3,3*128*4/3);
                      wmaGlobe.mapContext.drawImage(wmaGlobe.tmap,0,0,6*128*4/3,3*128*4/3);
                      wmaGlobe.mapContext.save();
                      wmaGlobe.mapContext.globalAlpha = 0.5;
                      wmaDrawKML(3*128,0,0,6*128,3*128,wmaGlobe.omapContext)
                      wmaGlobe.mapContext.drawImage(wmaGlobe.omap,0,0,6*128*4/3,3*128*4/3);
                      wmaGlobe.mapContext.restore();
                      wmaGlobe.updateTexture();
                      wmaGlobe.draw();
                    }
                  }
                  // check if overlay has already been loaded
                  if( wmakml.canvas ) {
                    wmaGlobe.updateKML();
                  } else {
                    wmaGlobe.updateTiles();
                  }
                }
              }).attr('src',wma_tilesets[wma_tileset].getTileURL(y,x,0,true)); // disable rotating tileservers (causes DOM Security exception)
            })(i,j);
          }
        }
      }

      $('body').append(globe).append(map).append(shadow);
      //loadTiles();
      return loadTiles;
    })();
    
    // parse coordinates
    var coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)/;
    if(coord_filter.test(coord_params))
    {
      coord_filter.exec(coord_params);
      marker.lat = parseFloat( RegExp.$1 );
      marker.lon = parseFloat( RegExp.$2 );
      wma_width = $(window).width();
      wma_height= $(window).height();

      coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)/;
      if( coord_filter.test(coord_params) ) {
        coord_filter.exec(coord_params);
        wma_site = RegExp.$5;
      }
     
     coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)_([\d]+)/;
     if( coord_filter.test(coord_params) ) {
      coord_filter.exec(coord_params);
      wma_defaultzoom = parseInt( RegExp.$6, 10 );
      wmaSetZoom(wma_defaultzoom);
      // make sure zoom is in range
      wmaSetZoom( Math.min( wma_zoom, 
            ( wma_tileset != 0 ? wma_tilesets[wma_tileset].maxzoom : ((hasCanvas&&wma_highzoom_activated)?15:12) ) ) );
      wmaSetZoom( Math.max( wma_zoom, wma_tilesets[wma_tileset].minzoom ) );
     }

     coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)_([\d]+)_([a-z]+)/;
     if(coord_filter.test(coord_params)) {
      coord_filter.exec(coord_params);
      wma_language = RegExp.$7;
     } else {
      wma_language = wma_site;
     }

     coord_filter = /([\d+-.]+)_([\d+-.]+)_([\d]+)_([\d]+)_([a-z]+)_([\d]+)_([a-z]+)_([\d+-.]+)_([\d+-.]+)/;
     if(coord_filter.test(coord_params)) {
       newcoords = wmaLatLonToXY( RegExp.$8, RegExp.$9 );
       wma_marker_locked = false;
       wma_own_close = true;
     } else {
       newcoords = wmaLatLonToXY( marker.lat, marker.lon );
       wma_marker_locked = true;
     }

     wma_gx = newcoords.x-wma_width/2;
     wma_gy = newcoords.y-wma_height/2;
    }

    UILang = wma_language;
    if( UILang == 'co' || UILang == 'commons' ) UILang = 'en';
    UIrtl = isRTL(UILang);

    // Fill missing i18n items
    for( i in strings ) {
     if( !strings[i][UILang] ) strings[i][UILang] = strings[i].en;
    }

    WikiMiniAtlasHTML = 
     '<div class="bsprite" id="button_plus" title="' + strings.zoomIn[UILang] + '"></div>' +
     '<div class="bsprite" id="button_minus" title="' + strings.zoomOut[UILang] + '"></div>' +
     '<div class="bsprite" id="button_target" title="' + strings.center[UILang] + '"></div>' +
     '<div class="bsprite" id="button_kml" title="' + strings.kml[UILang] + '"></div>' +
     '<div class="bsprite" id="button_menu" title="' + strings.settings[UILang] + '"></div>';

    if( wma_own_close ) {
     WikiMiniAtlasHTML += '<img id="button_hide" src="'+wma_imgbase+'button_hide.png" title="' + 
      strings.close[UILang] + '" onclick="window.close()">';
    } else {
     WikiMiniAtlasHTML += '<img id="button_fs" src="'+wma_imgbase+'button_fs.png" title="' + 
      strings.fullscreen[UILang] + '">';
    }

    WikiMiniAtlasHTML += '<div id="wma_map" style="position:absolute; width:' + wma_width + 
     'px; height:' + wma_height + 'px; cursor: move; background-color: #aaaaaa;"></div>';

    // Scalebar
    WikiMiniAtlasHTML += 
     '<div id="scalebox"><div id="scalebar"></div>' +
     '<div id="scalelabel">null</div></div>';

    // Synopsis box
    WikiMiniAtlasHTML += '<div id="synopsis"><p id="synopsistext"></p></div>';
   
    // Settings page
    WikiMiniAtlasHTML += 
     '<div id="wma_settings">' +
     '<h4>' + strings.settings[UILang] + '</h4>' +
     '<p class="option">' + 'Size Comparison' + ' <select id="wmaSetSizeOverlay">';

    l = strings.sover[UILang].list;
    WikiMiniAtlasHTML += '<option value="-" class="bg" selected="selected">-</option>';
    WikiMiniAtlasHTML += '<option value="+" class="bg">'+strings.other[UILang]+'</option>';
    WikiMiniAtlasHTML += '<option value="*" class="bg">'+decodeURIComponent(page)+'</option>';
    for( i in l ) {
      WikiMiniAtlasHTML += '<option value="' + l[i] + '">' + l[i] + '</option>';
    }
    WikiMiniAtlasHTML +=
     '</select></p>' +
     '<a href="//wiki.toolserver.org/" target="_top"><img src="//toolserver.org/images/wikimedia-toolserver-button.png" border="0"></a>' +
     '</div>';

    wma_widget
      .html( WikiMiniAtlasHTML )
      .append(
        $('<span></span>', { id: 'wmacredit' } )
          .append( $('<a></a>', { href: "//meta.wikimedia.org/wiki/WikiMiniAtlas/"+wma_language, target: '_top' } )
                    .text('WikiMiniAtlas') )
          .append( credit = $('<span></span>') )
      );

    // '" target="_top" style="z-index:11; position:absolute; bottom:3px; right: 10px; color:black; font-size:5pt">WikiMiniAtlas</a>';

    // build and hook-up dropdown menu
    
    var menu = new wmaMenu(UIrtl);
    (function(){
      var i,j,l=[],g;

      // Label selection menu section
      menu.addTitle(strings.labelSet[UILang],UIrtl);
      WikiMiniAtlasHTML = '<select id="wmaLabelSet">';
      for( i in wikiminiatlas_sites ) {
       if( i !== 'commons' ) {
         WikiMiniAtlasHTML += '<option value="' + i + '"';
          if( i == wma_site ) { WikiMiniAtlasHTML += 'selected="selected"'; }
         WikiMiniAtlasHTML += '>' + wikiminiatlas_sites[i] + '</option>';
       }
      } 
      WikiMiniAtlasHTML += '</select>';
      g = menu.addGroup([
        ['LANG',WikiMiniAtlasHTML],
        ['commons',strings['commons'][UILang]]
      ],function(s) {
        if(s=='LANG') {
          s=g.items['LANG'].find('select option:selected').val();
        }
        wmaLabelSet(s);
      },wma_site=='commons'?'commons':'LANG',UIrtl);
      g.items['LANG'].find('select')
        .click(function(e){ e.stopPropagation(); })
        .change(function(e){ g.items['LANG'].click(); });
      menu.addSep();

      // Globe and layer selection sections
      var globes = {};
      for( i = 0; i < wma_tilesets.length; i++ ) {
        j = wma_tilesets[i].globe;
        globes[j] = globes[j] || [];
        globes[j].push( [i, strings[wma_tilesets[i].name][UILang] || ''] );
      }
      WikiMiniAtlasHTML = '<select id="wmaGlobeSet">';
      for( i in globes ) {
         WikiMiniAtlasHTML += '<option value="' + i + '"';
          if( i == globe ) { WikiMiniAtlasHTML += 'selected="selected"'; }
         WikiMiniAtlasHTML += '>' + strings['map'+i][UILang] + '</option>';
      } 
      WikiMiniAtlasHTML += '</select>';
      menu.addTitle(strings.solarSystem[UILang],UIrtl);
      var gmenu = menu.addItem(WikiMiniAtlasHTML,undefined,UIrtl);
      gmenu.find('select')
        .click(function(e){ e.stopPropagation(); })
        .change(function(e){ 
          var n = $(this).find('option:selected').val();
          globes[globe].hide();
          globes[n].show();
          globe = n;
          gmenu.click(); 
          wmaSelectTileset(globes[n].current());
        });
      menu.addSep();

      // insert a group for every globe
      menu.addTitle(strings.mode[UILang],UIrtl);
      for( i in globes ) {
        globes[i] = menu.addGroup( globes[i], wmaSelectTileset, globes[i][0][0], UIrtl );
        if( i !== globe ) { globes[i].hide(); }
        menu.addSep();
      }
      menu.addItem(strings.sizeRef[UILang],toggleSettings);
    })();

    $('#button_menu').click( function(){menu.toggle();} );
    $('#button_fs').click( wmaFullscreen );
    $('#wma_widget').append(menu.div.css({ right: '40px', top: '26px' }));

    l = strings.dyk[UILang];
    var news = $('<div></div>').html(l[Math.floor(Math.random()*l.length)]).addClass('news');
labelcaption = $('<div></div>').css({position:'absolute', top: '30px', left:'60px', zIndex:100, fontSize:'40px', color:'white', textShadow:'1px 1px 5px black', fontWeight:'bold'}).appendTo('#wma_widget');
    
    // add global news item actions
    wmaNews[0] = function() { wmaSelectTileset(4); };
    wmaNews[1] = function() { 
      if( hasCanvas ) {
        wma_gx=19039255; wma_gy=3363704; wmaSetZoom(15); wmaSelectTileset(0); 
      } else {
        news.text('Sorry, your browser does not support the canvas element! Try FireFox or Google Chrome.');
      }
    };
    

    //var news = $('<div></div>').html('<b>New:</b> More Zoom and new data by OpenStreetMap.').addClass('news');
    $('#wma_widget').append(news);
    news.click( function() { news.fadeOut(); } )
    setTimeout( function() { news.fadeOut(); }, 10*1000 );

    scalelabel = $('#scalelabel');
    scalebar = $('#scalebar');

    wma_taget_button = document.getElementById('button_target');
    wma_settings = document.getElementById('wma_settings');

    $('#wmaLabelSet').change( function() { wmaLabelSet( this.value ) } );
    $('#wmaSetSizeOverlay').change( function() { wmaSetSizeOverlay( strings.sover[UILang].site, this.value ) } );
   
    $('#button_plus').bind('mousedown', wmaZoomIn );
    $('#button_minus').bind('mousedown', wmaZoomOut );
    $('#button_target').click(wmaMoveToTarget);
    $('#button_kml').click(wmaToggleKML);

    //document.body.oncontextmenu = function() { return false; };
    $(document).keydown(wmaKeypress);
    $(document).bind('contextmenu', function() { return false; } );

    $('body').bind('dragstart', function() { return false; } )
    $('#wma_map').click( function(e) { 
        // only count clicks if the mouse pointer has not moved between mouse down and mouse up! 
        var r = wmaMouseCoords(e.originalEvent);
        if( r.x != wma_mdcoord.x || 
            r.y != wma_mdcoord.y ) return false; 
      } );

    initializeWikiMiniAtlasMap();

    // 3d building outlines
    bldg3d = $('<canvas class="wmakml"></canvas>')
        .attr( { width: wma_width, height: wma_height } )
        .css( { zIndex:19, opacity: 0.75 } )
        .appendTo( $(wma_map) );
    if( hasCanvas ) { 
      // try to use webgl
      try {
        bldg3dc = bldg3d[0].getContext("experimental-webgl");
        update3dBuildings = update3dBuildings_webgl_builder(bldg3dc);
      } catch (e) { 
        bldg3dc=null; 
        // replace canvas
        bldg3d.remove();
        bldg3d = $('<canvas class="wmakml"></canvas>')
            .attr( { width: wma_width, height: wma_height } )
            .css( { zIndex:19, opacity: 0.75 } )
            .appendTo( $(wma_map) );
      }

      // wireframe as fallback
      if( !bldg3dc || update3dBuildings===false ) {
        bldg3dc = bldg3d[0].getContext('2d'); 
        update3dBuildings = update3dBuildings_canvas;
      }
    }

    $(window).resize(wmaResize);

    // select tileset compatible with globe parameter
    var WikiMiniAtlasHTML,i,l;
    for( i=0; i<wma_tilesets.length && wma_tilesets[i].globe!=globe; ++i );
    wmaSelectTileset(i,true);

    moveWikiMiniAtlasMapTo();
    wmaUpdateTargetButton();

    synopsis_filter = /https?:\/\/([a-z-]+)\.wikipedia\.org\/wiki\/(.*)/;
    $('#wma_widget').mouseover( function(e){
      var l,t;
      if( e.metaKey ) {
        if( e.target.href && synopsis_filter.test(e.target.href) ) {
          l = RegExp.$1;
          t = RegExp.$2;
          $('#synopsistext').load( '/~dschwen/synopsis/?l=' + l + '&t=' + t, function() { 
            $('#synopsistext')
              .css('direction',isRTL(l)?'rtl':'ltr')
              .find('a').attr('target','_top');
            $('#synopsis').fadeIn('slow');
            setTimeout( function() { 
              var h = $('#synopsistext').outerHeight(true),
                  mh = wma_height/2;
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

  function toggleWikiMiniAtlas() {
   if(wma_widget.css('visibility') != "visible") {
     wma_widget.css('visibility',"visible");
   } else {
     wma_widget.css('visibility',"hidden");
   }
   return false;
  }

  function toggleSettings()
  {
   if( wma_settings.style.visibility != "visible" ) {
    wma_settings.style.visibility="visible";
   } else {
    wma_settings.style.visibility="hidden";
   }
   return false;
  }

  function wmaNewTile() {
    var d = $('<div></div>').addClass('wmatile').mousedown(mouseDownWikiMiniAtlasMap).click(function(e){
          // only count clicks if the mouse pointer has not moved between mouse down and mouse up! 
          var s, r = wmaMouseCoords(e.originalEvent);
          if( r.x != wma_mdcoord.x || 
              r.y != wma_mdcoord.y ||
              !t.csrender ) return true; 
          s = wmajt.detectPointer(e,t);
          if(s) {
            wmaNotice(s);
          }
        })
      , h = null
      , t = {
      div : d,
      img : $('<img>')
        .load(function(e){
          $(this).fadeIn(100);
        })
        .error(function(e){
          // tile is probably not ready yet, try again in one second
          // TODO: add max tries
          h = setTimeout( function() {
            t.img.attr("src",t.img.attr('src') + "?" + Math.random() );
          }, 1000 );
        })
        .appendTo(d),
      can : $('<canvas></canvas>').appendTo(d),
      ctx : null,
      csrender: false,
      csx:0,csy:0,csz:20,
      lx:0,ly:0,lz:20,
      span : $('<span></span>').appendTo(d),
      debug : $('<span></span>').addClass('wmadbg').css('display','none').appendTo(d),
      url : '',
      xhr : null
    }
    if( hasCanvas ) {
      t.can.attr({width:128,height:128});
      t.ctx = t.can[0].getContext('2d');
    }
    $(wma_map).append(t.div);
    return t;
  }

  function initializeWikiMiniAtlasMap()
  {
    var i, j;
    if(wma_map === null)
    {
      $(document)
        .mousemove(mouseMoveWikiMiniAtlasMap)
        .mouseup( function(){ wma_dragging = null; } );
      $('#wma_map').dblclick(wmaDblclick).mousedown(mouseDownWikiMiniAtlasMap);
      wma_map = document.getElementById('wma_map');

      wma_nx = Math.floor(wma_width/tsx)+2;
      wma_ny = Math.floor(wma_height/tsy)+2;
      wma_tile = [];

      for(var j = 0; j < wma_ny; j++) {
        for(var i = 0; i < wma_nx; i++) {
          wma_tile.push(wmaNewTile());
        }
      }

      marker.obj = $('<div id="wmamarker"></div>');
      $(wma_map).append(marker.obj);
    }
  }

  function wmaResize() {
    var nw = $(window).width(),
        nh = $(window).height(),
        nx = Math.floor(nw/tsx)+2,
        ny =  Math.floor(nh/tsy)+2, i;
    wma_width = nw;
    wma_height = nh;

    if( hasCanvas ) {
      // resize kml canvas, if it exists
      if( wmakml.canvas !== null ) {
        wmakml.canvas.attr( { width: nw, height: nh } );
      }
      // 3D building canvas
      bldg3d.attr( { width: nw, height: nh } );
      // set webgl viewport 
      if( bldg3dc.viewport ) bldg3dc.viewport(0,0,nw,nh);

      // TODO: resize overlay canvas!
    }

    if( nx != wma_nx || ny != wma_ny ) {
      wma_nx = nx;
      wma_ny = ny;
      // add more tiles if necessary
      while( wma_tile.length < nx*ny ) {
        wma_tile.push(wmaNewTile());
      }
      // make sure needed tiles are visible, unneded tiles are hidden
      for( i=0; i < wma_tile.length; ++i ) {
        if( i < nx*ny ) { 
          wma_tile[i].div.show();
        } else {
          wma_tile[i].div.hide();
        }
      }


      moveWikiMiniAtlasMapTo();
      $(wma_map).width(nw).height(nh);//.css('clip','rect(0px '+nw+'px '+nh+'px 0px)');
    } else {
      if( wmakml.shown ) {
        wmaDrawKML();
      }
    }
  }

  // toggle layer visibility
  function wmaToggleKML() {
    if( wmakml.shown ) {
      wmakml.canvas.fadeOut(200);
    } else {
      wmakml.canvas.fadeIn(200);
    }
    wmakml.shown = !wmakml.shown;
  }

  // draw KML data
  function wmaDrawSizeOverlay(at) {
    var i, j, n, c = wmasize.c, w = wmasize.ways, a = wmasize.areas, p
      , gx=wma_gx, gy=wma_gy
      ;

    function addToPath(w) {
      var k, p, lx, dx, lat;
      if( w.length > 0 ) {
        lat = w[0].lat + at.lat;
        p = wmaLatLonToXYnoWrap( lat, w[0].lon/Math.cos(lat/180.0*Math.PI) + at.lon );
        lx = p.x;
        c.moveTo( p.x-gx, p.y-gy );
        for( k = 1; k < w.length; ++k ) {
          lat = w[k].lat + at.lat;
          p = wmaLatLonToXYnoWrap( lat, w[k].lon/Math.cos(lat/180.0*Math.PI) + at.lon );
          c.lineTo( p.x-gx, p.y-gy );
        }
      }
    }

    if( c !== null ) {
      // clear canvas
      c.clearRect( 0,0, wmasize.canvas[0].width, wmasize.canvas[0].height );


      // areas
      if( a !== null ) {
        c.fillStyle = "rgb(0,255,0)";
        for( i = 0; i<a.length; i++ ) {
          c.globalCompositeOperation = 'source-over';
          for( j = 0; j<a[i].outer.length; ++j ) {
            c.beginPath();
            addToPath(a[i].outer[j]);
            c.closePath();
            c.fill();
          }
          c.globalCompositeOperation = 'destination-out';
          for( j = 0; j<a[i].inner.length; ++j ) {
            c.beginPath();
            addToPath(a[i].inner[j]);
            c.closePath();
            c.fill();
          }
        }
      }

      // draw ways
      if( w !== null ) {
        c.globalCompositeOperation = 'source-over';
        c.lineWidth = 4.0;
        c.strokeStyle = "rgb(0,255,0)";
        c.beginPath();
        for(i =0; i<w.length; ++i ) {
          addToPath(w[i]) 
        }
        c.stroke();
      }
    }
  }

  // draw KML data
  function wmaDrawKML(hw,ox,oy,ow,oh,c) {
    var i, j, n, w = wmakml.ways, a = wmakml.areas, p, p1, p2, gx
      ;

    // all parameters optional (used only for updating globe texture)
    hw = hw || wma_zoomsize[wma_zoom]*tsx;
    ox = (ox!==undefined)?ox:wma_gx; // to allow passing 0 as a parameter!
    oy = (oy!==undefined)?oy:wma_gy;
    c = c || wmakml.c;
    gx = ox;

    function addToPath(w) {
      var k, p, wx = 0, lx, dx;
      if(  w[0].lon < wmakml.minlon ) { wx = 2*hw; }
      if( w.length > 0 ) {
        p = wmaLatLonToXYnoWrap( w[0].lat, w[0].lon, hw );
        lx = p.x;
        c.moveTo( p.x-gx+wx, p.y-oy );
        for( k = 1; k < w.length; ++k ) {
          p = wmaLatLonToXY( w[k].lat, w[k].lon, hw );
          dx = p.x - lx;
          if( Math.abs(dx) > hw ) {
            wx -= Math.round(dx/(2*hw))*2*hw;
          }
          lx = p.x;
          c.lineTo( p.x-gx+wx, p.y-oy );
        }
      }
    }

    if( c !== null ) {
      // clear canvas
      ow = ow || wmakml.canvas[0].width;
      oh = oh || wmakml.canvas[0].height;
      c.clearRect( 0,0, ow, oh );

      // loop over multiple copies (wrap around the sphere) 
      for( n=-2; n<=2; ++n ) {
        gx = ox + n*2*hw;
        p1 =  wmaLatLonToXYnoWrap(0,wmakml.minlon,hw);
        p2 =  wmaLatLonToXYnoWrap(0,wmakml.maxlon,hw);
        if( p2.x-gx < 0 || p1.x-gx > ow ) { continue; }

        // areas
        if( a !== null ) {
          c.fillStyle = "rgb(255,0,0)";
          c.strokeStyle = "rgb(0,0,0)";
          c.lineWidth = 2.0;
          for( i = 0; i<a.length; i++ ) {
            c.globalCompositeOperation = 'source-over';
            for( j = 0; j<a[i].outer.length; ++j ) {
              c.beginPath();
              addToPath(a[i].outer[j]);
              c.closePath();
              c.fill();
              c.stroke();
            }
            c.globalCompositeOperation = 'destination-out';
            for( j = 0; j<a[i].inner.length; ++j ) {
              c.beginPath();
              addToPath(a[i].inner[j]);
              c.closePath();
              c.fill();
              c.stroke();
            }
          }
        }

        // draw ways
        if( w !== null ) {
          c.globalCompositeOperation = 'source-over';
          c.lineWidth = 4.0;
          c.strokeStyle = "rgb(0,0,255)";
          c.beginPath();
          for(i =0; i<w.length; ++i ) {
            addToPath(w[i]) 
          }
          c.stroke();
        }
      }
    }
  }

  // Set new map Position (to wma_gx, wma_gy)
  function moveWikiMiniAtlasMapTo()
  {
    function parseLabels(tile,l) {
      var w,a, i,io
        , ix=[0,0,5,0,0,2,3,4,5,6,6]
        , iy=[0,0,8,0,0,2,3,4,5,6,6];

      tile.text('');
      for( i=0; i<l.length; ++i ) {
        a = $('<a></a>')

        if( "img" in l[i] ) {
          // thumbnails
          (function(n,w,h,m5){
            a.click( function(e) {
              // this is necessary to allow dragging the map on thumbnails in Firefox
              var r = wmaMouseCoords(e.originalEvent);
              if( r.x != wma_mdcoord.x || 
                  r.y != wma_mdcoord.y ) {
                 e.preventDefault(); 
              } else {
                // open the wmaci preview on left click
                if( e.which == 1 ) {
                  wmaCommonsImage(n,w,h,m5); 
                  e.preventDefault();
                }
                // otherwise follow the link (allows for middle click opening the commons page)
              }
            } ).attr( 'href', '//commons.wikimedia.org/wiki/Image:' + l[i].img );
          })(l[i].img,l[i].w,l[i].h,l[i].m5);

          w = ( parseInt(l[i].w) > parseInt(l[i].h) ) ? (l[i].style==-2?24:48) : Math.floor((l[i].style==-2?24:48)*l[i].w/l[i].h);
          
          a.addClass('cthumb')
            .append( $('<img/>', { 
                title: decodeURIComponent( l[i].img )
              } )
              .error(function(){ $(this).parent().hide() } )
              .attr('src', wmaCommonsThumb( l[i].img, w, l[i].m5) )
            );

          if( l[i].head < 18 ) {
            a.addClass('dir dir'+l[i].head);
            io = 8;
          } else {
            io = 6;
          }

          a.css( {
            top:  ( l[i].ty - io ) + 'px',
            left: ( l[i].tx - io ) + 'px'
          } );
        } else {
          // text labels
          a.addClass('label').addClass( 'label' + l[i].style ).css(wmaLinkStyle)
            .attr( { 
              href: '//' + l[i].lang + '.wikipedia.org/wiki/' + l[i].page,
              target: '_top' 
            } )
            .css( {
              top:  ( l[i].ty - iy[l[i].style] ) + 'px',
              left: ( l[i].tx - ix[l[i].style] ) + 'px',
              direction: isRTL(l[i].lang) ? 'rtl' : 'ltr'
            } ) 
           .text(l[i].name);
        }

        tile.append(a);
      }
    } 

    // zooming beyond maximum label zoom
    function hizoomLabels( tile, l ) {
      var x = tile.lx, y = tile.ly, z = tile.lz
        , f = 1<<(z-wma_maxlabel), dx, dy
        , d, tx, ty, l2 = [], i, q=[[],[],[],[]];
        
      // for every label
      // ( wlmax coords - (dx,dy) + (fx,fy) ) * f
      for( i=0; i < l.length; i++ ) {
        dx = 128 * ( x/f - l[i].dx );
        dy = 128 * ( y/f - (wma_zoomsize[wma_maxlabel]-l[i].dy-1) ); // label.dy value is broken
        tx = (l[i].tx+l[i].fx-dx)*f;
        ty = (l[i].ty+l[i].fy-dy)*f;
        if( tx >=0 && tx<128 && ty >=0 && ty<128 ) {
          // make a clone of the old label object (TODO: sort first, clone later )
          d = jQuery.extend( true, {}, l[i] );
          d.tx = Math.floor(tx); d.ty = Math.floor(ty);
          d.fx = tx-d.tx; d.fy = ty-d.ty;
          q[ Math.floor( tx/64) + 2*Math.floor( ty/64 ) ].push(d);
        }
      }

      // sort into quadrants
      for( i=0; i < 4; i++ ) {
        if( q[i].length > 0 ) {
          q[i].sort(function(a,b){return b.wg-a.wg});
          l2.push(q[i][0]);
        }
      }
      parseLabels(tile.span,l2);
    }


   if(wma_gy<0) wma_gy=0;
   if(wma_gx<0) wma_gx+=Math.floor(wma_zoomsize[wma_zoom]*2*tsx); // TODO: Mercator is 1:1 not 2:1
   if(wma_gx>0) wma_gx%=Math.floor(wma_zoomsize[wma_zoom]*2*tsx);

   var lx = Math.floor(wma_gx/tsx) % wma_nx
     , ly = Math.floor(wma_gy/tsy) % wma_ny
     , fx = wma_gx % tsx
     , fy = wma_gy % tsy
     , mlx, mly, hash, ht, d
     , i, j, k, dx, dy, n, thistile, tileurl, dataurl;

   wmaUpdateScalebar();
   //document.getElementById('debugbox').innerHTML='';

   var t1 = new Date;

   for(var j = 0; j < wma_ny; j++)
    for(var i = 0; i < wma_nx; i++)
    {
     n = ((i+lx) % wma_nx) + ((j+ly) % wma_ny)*wma_nx;

     //thistile.innerHTML = (Math.floor(wma_gx/128)+i)+','+(Math.floor(wma_gy/128)+j);
     dx = (Math.floor(wma_gx/tsx)+i);
     dy = (Math.floor(wma_gy/tsy)+j);
     
     //tileurl = 'url("' + wma_tilesets[wma_tileset].getTileURL( dy, dx, wma_zoom) + '")';
     tileurl = wma_tilesets[wma_tileset].getTileURL( dy, dx, wma_zoom);

     // move tile
     thistile = wma_tile[n];
     thistile.div.css( {
       left : (i*tsx-fx) + 'px',
       top  : (j*tsy-fy) + 'px'
     } );

     if( thistile.url != tileurl || wma_highzoom_purge )
     {
      thistile.url = tileurl;
      if( wma_tileset==0 && wma_zoom>12 ) { // client side render
        // just zoomed into client side render zoom range
        if( !thistile.csrender ) {
          thistile.csrender = true;
          // TODO: bug where imgs that are still loading now will fade back in below the canvas tiles!
          thistile.img.fadeOut(200);
        }

        // need to re-render this tile
        if( thistile.csx != dx || thistile.csy != dy || thistile.csz != wma_zoom || wma_highzoom_purge ) {
          thistile.can.hide();
          thistile.img.hide();
          wmajt.update(dx,dy,wma_zoom,thistile,wma_highzoom_purge);
        }
      } else { // regular image tiles
        // just zoomed out of client-side render zoom range
        thistile.csz = wma_zoom;
        if( thistile.csrender ) {
          thistile.can.fadeOut(200);
        }

        // off the world
        if( dy >= wma_zoomsize[wma_zoom] ) {
          thistile.img.fadeOut(0);
          thistile.span.text('');
          continue;
        }

        // set or display tile image
        if( thistile.img.attr('src') != tileurl ) { // catch mere label language change
          thistile.img.fadeOut(0).attr( 'src', tileurl );
        } else {
          if( thistile.csrender ) { 
            thistile.img.fadeIn(200);
          }
        }
        thistile.csrender = false;
      }

      if( thistile.xhr !== null ) {
       thistile.xhr.abort();
      }

      thistile.lx = dx; thistile.ly = dy; thistile.lz = wma_zoom;
      thistile.span.html('<span class="loading">' + strings.labelLoading[UILang] + '</span>');

      if( wma_zoom > wma_maxlabel ) {
        mlx = Math.floor(dx/(1<<(wma_zoom-wma_maxlabel)));
        mly = Math.floor(dy/(1<<(wma_zoom-wma_maxlabel)));
        dataurl = wmaGetDataURL( mly, mlx, wma_maxlabel );
        hash = lHash( mly, mlx, wma_maxlabel );
      } else {
        dataurl = wmaGetDataURL( dy, dx, wma_zoom );
        hash = lHash( dy, dx, wma_zoom );
      }

      // TODO: instead of launching the XHR here, gather the needed coords and ...
      if( lc[hash] && !('filler' in lc[hash]) ) {
        ( wma_zoom < wma_maxlabel ) ? parseLabels(thistile.span,lc[hash].label) : hizoomLabels(thistile,lc[hash].label);
      } else {
        // prefill lower zoom from above zoom
        if( lc[hash] && 'filler' in lc[hash] ) {
          parseLabels( thistile.span, lc[hash].label );
        } else { 
          // cannot fill outside of this range
          if( wma_zoom <= wma_maxlabel && wma_zoom > 0 ) {
            ht = lHash( Math.floor(dy/2), Math.floor(dx/2), wma_zoom-1 );
            if( lc[ht] ) {
              mlx = dx%2;
              lc[hash] = { label: [], filler: 1 }
              for( k=0; k<lc[ht].label.length; k++ ) {
                if( Math.floor(lc[ht].label[k].tx/64) === (dx%2) &&
                    Math.floor(lc[ht].label[k].ty/64) === (dy%2) ) {
                  d = jQuery.extend( true, {}, lc[ht].label[k] );
                  d.tx = (d.tx+d.fx)*2 - (dx%2)*128;
                  d.ty = (d.ty+d.fy)*2 - (dy%2)*128;
                  d.fx = d.tx - Math.floor(d.tx);
                  d.fy = d.ty - Math.floor(d.ty);
                  d.tx = Math.floor(d.tx); d.ty = Math.floor(d.ty);
                  lc[hash].label.push(d);
                }
              }
              parseLabels( thistile.span, lc[hash].label );
            }
          }
        }

        // or higher zoom 
        /*  for( k=0; k<4; k++ ) {
            ht=lHash(Math.floor(dx/2)
          }*/

        // TODO 
        (function(hash,turl,lo){// closure to retain access to dataurl in sucess callback
          //thistile.xhr = $.ajax( { url : turl, context : thistile.div } )
          thistile.xhr = $.ajax( { url : turl, context : thistile } )
            .success( function(data) { 
              try {
                lc[hash] = JSON.parse(data);
                lo ? parseLabels( this.span, lc[hash].label ) : hizoomLabels( this, lc[hash].label );
              } catch(e) {
                this.span.html(data);
              }
            } ) 
            .error( function() { this.span.text(''); } );
        })( hash, dataurl, wma_zoom < wma_maxlabel );
      }
      
     }
    }

    // ...request them here, all at once

    // update markers
    updateMarker(marker);
    for( n = 0; n < extramarkers.length; ++n ) {
     updateMarker(extramarkers[n]);
    }

    wma_highzoom_purge = false;

    // draw buildings
    if( wma_zoom >= wma_bldg3dzoom ) update3dBuildings();

    // update KML overlay
    wmaDrawKML();

    var t2 = new Date;
    //console.log('map rendering: ', t2.getTime()-t1.getTime(), 'ms' );
  }

  function update3dBuildings_webgl_builder(gl) {
    // initialize building webgl module
    gl.clearColor(0,0,0,0.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
    gl.clear( gl.COLOR_BUFFER_BIT + gl.DEPTH_BUFFER_BIT );

    // compile shaders
    var program = gl.createProgram();
    
    var vshader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vshader, $('#bldg-vs').text() );
    gl.compileShader(vshader);
    gl.attachShader(program, vshader);

    var fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, $('#bldg-fs').text() );
    gl.compileShader(fshader);
    gl.attachShader(program, fshader);
    
    gl.linkProgram(program);
    gl.useProgram(program);

    program.vertexPosAttrib = gl.getAttribLocation(program, 'pos');
    gl.enableVertexAttribArray(program.vertexPosAttrib);

    program.normalPosAttrib = gl.getAttribLocation(program, 'norm');
    gl.enableVertexAttribArray(program.normalPosAttrib);

    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var centerdegLocation = gl.getUniformLocation(program, "u_centerdeg");
    var lightdirLocation = gl.getUniformLocation(program, "u_lightdir");
    
    var lx=3, ly=2, lz=5;
    r = Math.sqrt(lx*lx+ly*ly+lz*lz);
    gl.uniform3f(lightdirLocation, lx/r,ly/r,lz/r );

    // hold 5000 triangles per buffer
    wmajt.registerWebGLBuildingData( 5000, gl, program );

    return function() {
      // draw arrays
      var dx = wma_width/2, dy = wma_height/2
        , f0 = 60.0/(128*1<<wma_zoom)
        , ll = wmaXYToLatLon(wma_gx+dx,wma_gy+dy);

      if( ll.lon > 180 ) { ll.lon -= 360.0 };

      // set zoom and position
      gl.uniform3f(resolutionLocation, dx*f0, dy*f0, 850);
      gl.uniform3f(centerdegLocation, ll.lon,ll.lat, 0 );

      // clear and render
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
      wmajt.renderWebGLBuildingData();
    }
  }

  function update3dBuildings_canvas() {
    if( hasCanvas && wma_zoom > wma_bldg3dzoom ) {
      var ref = wmajt.ref_z()
        , bui = wmajt.zbuild()
        , dx = wma_width/2, dy = wma_height/2
        , f0 = (128*1<<wma_zoom)/60.0, f1, f2
        , c = bldg3dc, h, m, d, i
        , ll = wmaXYToLatLon(wma_gx+dx,wma_gy+dy);

      if( ll.lon > 180 ) { ll.lon -= 360.0 };

      function addPath(g) {
        var j;
        // for elevated parts draw the base
        if( m> 0 ) {
          c.moveTo( (g[0][0]-ll.lon)*f1+dx, dy-(g[0][1]-ll.lat)*f1 );
          for(j=1; j<g.length; j++ ) { // loop over remaining points
            c.lineTo( (g[j][0]-ll.lon)*f1+dx, dy-(g[j][1]-ll.lat)*f1 );
          }
        }
        // draw risers and top
        for(j=0; j<g.length-1; j++ ) { // loop over all points
          c.moveTo( (g[j][0]-ll.lon)*f1+dx, dy-(g[j][1]-ll.lat)*f1 );
          c.lineTo( (g[j][0]-ll.lon)*f2+dx, dy-(g[j][1]-ll.lat)*f2 );
          c.lineTo( (g[j+1][0]-ll.lon)*f2+dx, dy-(g[j+1][1]-ll.lat)*f2 );
        }
      }

      c.lineWidth = 0.5;
      c.strokeStyle = 'rgb(0,0,0)';
      c.beginPath();

      bldg3dc.clearRect(0,0,wma_width,wma_height);
      for( i in ref ) {
        d = bui[i].geo.coordinates;
        h = (bui[i].tags['building:levels']*3)||bui[i].tags['height'];
        m = (bui[i].tags['building:min_level']*3)||bui[i].tags['min_height']||0;
        f1 = f0*(1+m/450);
        f2 = f0*(1+h/450);
        if( bui[i].geo.type === 'Polygon' ) {
          for(i=0; i<d.length; i++ ) { // loop over sub polygons
            addPath(d[i]);
          }
        } else {
          addPath(d);
        }
      }
      c.stroke();
      bldg3d.show();

      if( bldg3dtimer !== null ) {
        clearTimeout(bldg3dtimer);
      }
      setTimeout(update3dBuildings,1500);
    } else {
      bldg3d.hide();
    }
  }

  // position marker
  function updateMarker(m) {
   var newcoords = wmaLatLonToXY( m.lat, m.lon )
     , newx = ( newcoords.x - wma_gx );
   if( newx < -100 ) newx += ( wma_zoomsize[wma_zoom] * 256 );
   m.obj.css( 'left', (newx-6)+'px' );
   m.obj.css( 'top',  (newcoords.y-wma_gy-6)+'px' );
  }

  // Mouse down handler (start map-drag)
  function mouseDownWikiMiniAtlasMap(ev) {
    wma_mdcoord = wma_dragging = wmaMouseCoords(ev);
  }

  // Mouse move handler
  function mouseMoveWikiMiniAtlasMap(ev) {
    window.scrollTo(0,0);
    var newcoords = wmaMouseCoords(ev);

    if( wma_dragging !== null )
    {

      wma_gx -= ( newcoords.x - wma_dragging.x );
      wma_gy -= ( newcoords.y - wma_dragging.y );
      wma_dragging = newcoords;
      moveWikiMiniAtlasMapTo();

      if( wma_marker_locked )
      {
        wma_marker_locked = false;
        wmaUpdateTargetButton();
      }
    }

    // display size overlay at mouse coords
    if( wmasize.shown ) {
      wmaDrawSizeOverlay( wmaXYToLatLon(wma_gx+newcoords.x,wma_gy+newcoords.y) );
    }

    //rotate globe
    var mapcenter = wmaXYToLatLon(wma_gx+wma_width/2,wma_gy+wma_height/2);
    wmaGlobe && wmaGlobe.setLatLon(mapcenter.lat,mapcenter.lon);
  }

  function wmaDblclick(ev) {
   var test = wmaMouseCoords(ev);

   wma_gx += test.x - wma_width/2;
   wma_gy += test.y - wma_height/2;

   if( wma_marker_locked )
   {
    wma_marker_locked = false;
    wmaUpdateTargetButton();
   }

   moveWikiMiniAtlasMapTo();
   return false;
  }

  function wmaNotice(s) {
    if( noticehandler ) clearTimeout(noticehandler);
    labelcaption.stop(true).fadeTo(1,1).text(s);
    noticehandler = setTimeout( function(){ labelcaption.fadeOut(200); }, 5000 );
  }

  function wmaSetZoom(z) {
    wma_zoom = z;

    // building layer
    if( bldg3d ) {
      if( z >= wma_bldg3dzoom ) 
        { bldg3d.show(); } 
      else
        { bldg3d.hide(); }
    }
  }

  function wmaSetSizeOverlay(lang,page) {
    if( page == '+' ) {
      page = prompt('Enter article title to use as overlay');
      if( !page ) { return; }
    }
    if( page == '*' ) {
      page = url_params['page'];
      lang = url_params['lang'];
    }
    if( page == '-' ) {
      wmasize.shown=false;
      wmasize.canvas.fadeOut(200);
      return;
    }
    wmaLoadSizeOverlay(lang,page);
    toggleSettings();
  }

  function wmaLoadSizeOverlay(lang,page) {
    $.ajax({
      url: '//toolserver.org/~master/osmjson/getGeoJSON.php?lang='+lang+'&article='+page,
      dataType: 'json',
      success: processSizeOverlay
    });
  }

  function wmaKeypress(ev) {
   var ret = false;
   ev = ev || window.event;
   switch( ev.keyCode || ev.which )
   {
    case 37 : wma_gx -= wma_width/1; break; 
    case 38 : wma_gy -= wma_height/1; break; 
    case 39 : wma_gx += wma_width/1; break; 
    case 40 : wma_gy += wma_height/1; break; 
    case 187 :
    case 107 : wmaZoomIn(); break;
    case 189 :
    case 109 : wmaZoomOut(); break;
    case 80 :
      wma_highzoom_purge = true;
      moveWikiMiniAtlasMapTo();
      break;
    case 79 : // o
      if( wmasize.shown ) {
        wmasize.shown=false;
        wmasize.canvas.fadeOut(200);
      } else { 
        wmaLoadSizeOverlay( strings.sover[UILang].site, strings.sover[UILang].list[0] );
      }
      break;
    case 84 :
      wmaSelectTileset( (wma_tileset+1) % wma_tilesets.length );
      break;
    case 76 :
      var ns, n
        //, alllang = ['ar','bg','ca','ceb','commons','cs','da','de','el','en','eo','es','et','eu','fa','fi','fr','gl','he','hi','hr','ht','hu','id','it','ja','ko','lt','ms','new','nl','nn','no','pl','pt','ro','ru','simple','sk','sl','sr','sv','sw','te','th','tr','uk','vi','vo','war','zh'];
        , alllang = ['en','de','fr','ru','ar','he', 'ko','ja','ml','fa','commons'];//,'cs','da','de','el','en','eo','es','et','eu','fa','fi','fr','gl','he','hi','hr','ht','hu','id','it','ja','ko','lt','ms','new','nl','nn','no','pl','pt','ro','ru','simple','sk','sl','sr','sv','sw','te','th','tr','uk','vi','vo','war','zh'];
      ns = alllang[($.inArray(wma_site,alllang)+1)%alllang.length];
      labelcaption.text( wikiminiatlas_sites[ns]);
      wmaLabelSet(ns, true )
      break;
    case 67:
      wmaLabelSet( 'commons', true );
      break;
    case 27 : // ESC
      // remove size comp overlay
      if( wmasize.shown ) {
        wmasize.shown=false;
        wmasize.canvas.fadeOut(200);
      }
      // quit commons preview
      if( wmaci.shown ) {
        wmaCommonsImageClose();
      }
      // quit settings
      if( wma_settings.style.visibility != "hidden" ) {
        wma_settings.style.visibility="hidden";
      }
      break;
    default: ret=true;
   }

   if( wma_marker_locked )
   {
    wma_marker_locked = false;
    wmaUpdateTargetButton();
   }

   moveWikiMiniAtlasMapTo();
   return ret;
  }

  function wmaMouseCoords(ev) {
   return {x:ev.pageX, y:ev.pageY};
  }

  function lHash(y,x,z) {
   return wma_site + '_' + (wma_zoomsize[z]-y-1) + '_' + (x % (wma_zoomsize[z]*2) ) + '_' + z + '_' + wma_tilesets[wma_tileset].globe;
  }
  function wmaGetDataURL(y,x,z) {
   return wma_database + '?l=' + wma_site + '&a=' + (wma_zoomsize[z]-y-1) + '&b=' + (x % (wma_zoomsize[z]*2) ) + '&z=' + z + '&g=' + wma_tilesets[wma_tileset].globe;
  }

  function tilesetUpgrade() {
  var globe = wma_tilesets[wma_tileset].globe;
   for( var i = wma_tileset+1; i < wma_tilesets.length; i++ ) {
    if( wma_tilesets[i].maxzoom >= (wma_zoom+1) &&
        wma_tilesets[i].globe == globe ) {
     wma_tileset = i;
     wma_zoom++;
     return;
    }
   }
  }

  function tilesetDowngrade() {
   for( var i = wma_tileset-1; i >= 0; i-- ) {
    if( wma_tilesets[i].minzoom < (wma_zoom-1) ) {
     wma_tileset = i;
     wma_zoom--;
     return;
    }
   }
  }

  function wmaZoomIn( ev ) {
   var mapcenter = wmaXYToLatLon(wma_gx+wma_width/2,wma_gy+wma_height/2);
   var rightclick = false;

   if(!ev) var ev = window.event;
   if(ev) {
    if (ev.which) { rightclick = (ev.which == 3); }
    else if (ev.button) { rightclick = (ev.button == 2); }
   } 

   if( rightclick ) {
     if( hasCanvas && wma_highzoom_activated ) {
       wmaSetZoom( ( wma_tileset==0 ) ? 15 : wma_tilesets[wma_tileset].maxzoom );
     } else {
       wmaSetZoom( ( wma_tileset==0 ) ? 12 : wma_tilesets[wma_tileset].maxzoom );
     }
   }
   else {
    if( wma_zoom >= ( ( wma_tileset==0 && !( hasCanvas && wma_highzoom_activated ) ) ? 12 : wma_tilesets[wma_tileset].maxzoom ) ) {
     //tilesetUpgrade();
    }
    else wmaSetZoom( wma_zoom+1);
   }

   var newcoords;

   if( wma_marker_locked )
    newcoords = wmaLatLonToXY( marker.lat, marker.lon );
   else
    newcoords = wmaLatLonToXY( mapcenter.lat, mapcenter.lon );

   wma_gx = newcoords.x-wma_width/2;
   wma_gy = newcoords.y-wma_height/2;
   moveWikiMiniAtlasMapTo();

   return false;
  }

  function wmaZoomOut( e ) {
   var mapcenter = wmaXYToLatLon(wma_gx+wma_width/2,wma_gy+wma_height/2);
   var rightclick = false;

   if(!ev) var ev = window.event;
   if(ev) {
    if (ev.which) rightclick = (ev.which == 3);
    else if (ev.button) rightclick = (ev.button == 2);
   }

   if( rightclick ) {
    wmaSetZoom( wma_tilesets[wma_tileset].minzoom );
   } else {
    if( wma_zoom <= wma_tilesets[wma_tileset].minzoom ) {
     tilesetDowngrade();
    } 
    else wmaSetZoom( wma_zoom-1);
   }

   var newcoords = wmaLatLonToXY(mapcenter.lat,mapcenter.lon);
   wma_gx = newcoords.x-wma_width/2;
   wma_gy = newcoords.y-wma_height/2;
   moveWikiMiniAtlasMapTo();

   return false;
  }

  function wmaSelectTileset( n, init ) {
    var newz = wma_zoom;
    wma_tileset = n;

    // set label style
    wmaLinkStyle = { color: wma_tilesets[n].linkcolor[0], textShadow: wma_tilesets[n].linkcolor[1] };
    $('a.label').css(wmaLinkStyle);
    
    // set attribution
    credit.text('');
    if( 'credit' in wma_tilesets[n] ) {
      credit.html(wma_tilesets[n].credit);
    }

    // make sure we are in zoom range for the new tile set
    if( newz > ( n != 0 ? wma_tilesets[n].maxzoom : ((hasCanvas&&wma_highzoom_activated)?15:12) ) )
      newz = wma_tilesets[n].maxzoom;
    if( newz < wma_tilesets[n].minzoom ) newz = wma_tilesets[n].minzoom;

    // keep map centered
    if( wma_zoom != newz ) {
      var mapcenter = wmaXYToLatLon(wma_gx+wma_width/2,wma_gy+wma_height/2);
      wmaSetZoom(newz);
      var newcoords = wmaLatLonToXY(mapcenter.lat,mapcenter.lon);
      wma_gx = newcoords.x-wma_width/2;
      wma_gy = newcoords.y-wma_height/2;
    }

    // update map
    if( !init ) {
      moveWikiMiniAtlasMapTo();
    }
    wmaGlobeLoadTiles();
  }

  function wmaLabelSet(s) {
    wma_site = s;
    for( var n = 0; n < wma_nx * wma_ny; n++) {
      wma_tile[n].url='';
    }
    moveWikiMiniAtlasMapTo();
  }

  function wmaUpdateScalebar() {
   var sblocation = wmaXYToLatLon(wma_gx+wma_width/2,wma_gy+wma_height/2);
   var slen1 = 50, slen2;
   var skm1,skm2;
   // slen1 pixels (50px) are skm1 kilometers horizontaly in the mapcenter
   skm1 = Math.cos(sblocation.lat*0.0174532778)*wma_tilesets[wma_tileset].equator*slen1/(256*wma_zoomsize[wma_zoom]);
   // get the closest power of ten smaller than skm1
   skm2 = Math.pow(10,Math.floor(Math.log(skm1)/Math.log(10)));
   // slen2/slen1 = skm2/skm1 get new length of this 'even' length in pixels 
   slen2 = slen1*skm2/skm1;
   // 2* and 5* a power of ten is also acceptable
   if( 5*slen2 < slen1 ) { slen2=slen2*5; skm2=skm2*5; }
   if( 2*slen2 < slen1 ) { slen2=slen2*2; skm2=skm2*2; }
   scalelabel.text( skm2<1 ? (skm2*1000)+' m' : skm2+' km' );
   scalebar.width(slen2);
  }

  function wmaUpdateTargetButton() {
   if( wma_marker_locked ) {
     $('#button_target').css('background-position', '');
   } else {
     $('#button_target').css('background-position', '-40px 0');
   }
  }

  function wmaMoveToCoord( lat, lon ) {
   var newcoords = wmaLatLonToXY( lat, lon );
   wma_gx = newcoords.x-wma_width/2;
   wma_gy = newcoords.y-wma_height/2;
   moveWikiMiniAtlasMapTo();
  }

  function wmaMoveToTarget() {
   wmaMoveToCoord( marker.lat, marker.lon );
   wma_marker_locked = true;
   wmaUpdateTargetButton();
  }

  // TODO: make a latlon and a mercator version for these
  function wmaLatLonToXYnoWrap(lat,lon,hw) {
    hw = hw || wma_zoomsize[wma_zoom]*tsx;
    return { y:Math.floor( (0.5-lat/180.0)*hw ), 
             x:Math.floor( (lon/360.0)    *hw*2 ) };
  }
  function wmaLatLonToXY(lat,lon,hw) {
   hw = hw || wma_zoomsize[wma_zoom]*tsx;
   var newx = Math.floor( (lon/360.0) * hw*2 );
   if( newx < 0 ) {
    newx += hw*2;
   }
   return { y:Math.floor((0.5-lat/180.0)*hw), x:newx };
  }

  function wmaXYToLatLon(x,y) {
   return { lat:180.0*(0.5-y/(wma_zoomsize[wma_zoom]*128)), lon:360.0*(x/(wma_zoomsize[wma_zoom]*256)) };
  }

  function wmaDebug(text) {
    $('#debugbox').append( $('<div></div>').text(text) );
  }

  function wmaCommonsThumb(img,w,m5) {
   return m5 ? 
     '//upload.wikimedia.org/wikipedia/commons/thumb/'+ m5[0] +'/'+ m5 +'/'+ img +'/'+ w +'px-'+ img :
     '//commons.wikimedia.org/w/thumb.php?w='+w+'&f='+img;
  }

  function wmaCommonsImageClose() {
    wmaci.shown = false;
    wmaci.panel.fadeOut(200);
  }

  function wmaCommonsImageBuild() {
   wmaci.panel = $('<div></div>', { id: 'wma_wmaci_panel' } )
     .append( 
       $('<div></div>', { id: 'wma_wmaci_panel_sub' } ) 
        .append( wmaci.span = $('<span></span>') )
        .append( $('<br/>') )
        .append( wmaci.link =  $('<a></a>', { id: 'wma_wmaci_link', target: '_top' } ) 
          .click( function(e) { e.stopPropagation(); } )
        )
     )
     .css('visibility','visible') // TODO, remove once CSS is updated in clients
     .hide()
     .click(wmaCommonsImageClose)
     .appendTo(wma_widget);
  }

  function wmaCommonsImage( name, w, h, m5 )
  {
    // first time viewing an image?
    if( wmaci.panel == null ) {
      wmaCommonsImageBuild();
    }

    var maxw = wma_width - 30;
    var maxh = wma_height - 80;
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
    wmaci.span.find('img').remove();
    var img = $('<img/>', { id: 'wma_wmaci_image' } ).appendTo(wmaci.span);

    if( imgw < w ) {
      img.attr( 'src', wmaCommonsThumb( name, Math.floor(imgw/10)*10, m5) );
    } else {
      img.attr( 'src', '//commons.wikimedia.org/wiki/Special:FilePath/' + name );
    }

    wmaci.link
      .attr('href','//commons.wikimedia.org/wiki/Image:' + name )
      .text('[[:commons:Image:' + decodeURIComponent(name) + ']]');

    wmaci.panel.fadeIn(200);
    wmaci.shown = true;
  }

  function wmaFullscreen() {
    var fs = window.open('', 'showwin', 'left=0,top=0,width=' + screen.width + ',height=' + screen.height + ',toolbar=0,resizable=0,fullscreen=1')
      , page = url_params['page']
      , lang = url_params['lang']
      , globe = wma_tilesets[wma_tileset].globe
      , mapcenter = wmaXYToLatLon( wma_gx + wma_width / 2, wma_gy + wma_height / 2 );

    fs.document.location = document.location.pathname + '?' + marker.lat + '_' + marker.lon + '_' + 0 + '_' + 0 + '_' + 
      wma_site + '_' + wma_zoom + '_' + wma_language + '_' + mapcenter.lat + '_' + mapcenter.lon + 
      '&globe=' + globe + '&page=' + page + '&lang=' + lang;
  }

  // mouse over handler for extra markers
  function extraMarkerMessage(index,cmd) {
   return function(e) {
    window.parent.postMessage( cmd + ',' + index, '*' );
   }
  }

  // make and insert a canvas element for KML/WIWOSM data
  function addKMLCanvas(geo) {
    if( !hasCanvas) { return; }

    geo = geo || wmakml;
    // add canvas overlay
    if( geo.canvas === null ) {
      geo.canvas = $('<canvas class="wmakml"></canvas>')
        .attr( { width: wma_width, height: wma_height } )
        .appendTo( $(wma_map) );
      geo.c = geo.canvas[0].getContext('2d');
      geo.shown = true;
      geo.drawn = true;
      if( geo == wmakml ) { $('#button_kml').show(); }
    }

    // update globe texture
    if( geo === wmakml && wmaGlobe ) {
      wmaGlobe.updateKML();
    }
  }

  // todo JSON for message passing!
  function wmaReceiveMessage(e) {
    e = e.originalEvent;
    var d = JSON.parse(e.data),i,j,m;

    // process point coordinates
    if( 'coords' in d ) {
      for( i=0; i < d.coords.length; ++i ) {
        m = { obj: null, lat: d.coords[i].lat, lon: d.coords[i].lon };
        if( Math.abs(m.lat-marker.lat) > 0.0001 || Math.abs(m.lon-marker.lon) > 0.0001 ) {
          m.obj = $('<div></div>')
            .attr( 'title', decodeURIComponent(d.coords[i].title) )
            .addClass('emarker')
            .mouseover( extraMarkerMessage(i,'highlight') )
            .mouseout( extraMarkerMessage(i,'unhighlight') )
            .click( extraMarkerMessage(i,'scroll') )
            .appendTo( $(wma_map) );
          updateMarker(m);
          extramarkers.push(m);
        }
      }
    }

    // process line coordinates
    if( ( 'ways' in d ) || ( 'areas' in d ) ) {
      addKMLCanvas();
      // copy data
      wmakml.ways  = d.ways  || null;
      wmakml.areas = d.areas || null;
      wmaDrawKML();
    }

    // process extent (only longitude for now)
    if( ( 'minlon' in d ) && ( 'maxlon' in d ) ) {
      if( !('maxlon' in wmakml) || d.maxlon > wmakml.maxlon ) { wmakml.maxlon = d.maxlon; }
      if( !('minlon' in wmakml) || d.minlon < wmakml.minlon ) { wmakml.minlon = d.minlon; }
    }
  }

  // reproject and insert the WIWOSM geoJSON data
  function processGeoJSON(d,geo) {
    // reproject from spherical mercator to WGS84
    function reproject(c) {
      var i, lat, lon, pi180 = 180/Math.PI, pi2 = Math.PI/2, mercx = 180.0/20037508.34, way=[]
        , maxlon = -Infinity, minlon = Infinity, w;
      for( i=0;  i<c.length; ++i ) {
        lon = c[i][0] * mercx;
        lat = pi180 * (2.0 * Math.atan(Math.exp(c[i][1]*mercx/pi180)) - pi2);
        // exploit that OSM objects never cross the 180/-180 line
        if( lon > maxlon ) { maxlon = lon; }
        if( lon < minlon ) { minlon = lon; }
        // lattitude is not a problem
        if( lat > geo.maxlat ) { geo.maxlat = lat; }
        if( lat < geo.minlat ) { geo.minlat = lat; }
        way.push( { lat : lat, lon : lon } );
      }
      // adjust the longitudinal extents
      if( !('maxlon' in geo) || !('maxlon' in geo) ) { 
        geo.maxlon = maxlon; 
        geo.minlon = minlon; 
      } else {
        w = [ { r: Math.max(geo.maxlon,maxlon), l: Math.min(geo.minlon,minlon) },
              { r: Math.max(geo.maxlon,maxlon+360), l: Math.min(geo.minlon,minlon+360)},
              { r: Math.max(geo.maxlon+360,maxlon), l: Math.min(geo.minlon+360,minlon)} ];
        w.sort(function(a,b){return (a.r-a.l)-(b.r-b.l)});
        geo.minlon = w[0].l;
        geo.maxlon = w[0].r;
      }
      return way;
    }

    function parsePolygon(p) {
      var area = { outer: [], inner: [] }, i;
      area.outer.push( reproject(p[0]) );
      for( i=1; i<p.length; i++ ) {
        area.inner.push( reproject(p[i]) );
      }
      if( geo.areas ) { geo.areas.push(area) } 
      else { geo.areas = [area]; }
    }
    function parseLineString(l) {
      var ways = [ reproject(l) ];
      if( geo.ways ) { geo.ways.push.apply(geo.ways,ways) }
      else { geo.ways = ways; }
    }

    function parseGeometry(g) {
      var i;
      switch( g['type']) {
        case "LineString": 
          parseLineString(g['coordinates']);
          break;
        case "MultiLineString": 
          for( i=0; i<g['coordinates'].length; i++ ) {
            parseLineString(g['coordinates'][i]);
          }
          break;
        case "Polygon":
          parsePolygon(g['coordinates']);
          break;
        case "MultiPolygon":
          for( i=0; i<g['coordinates'].length; i++ ) {
            parsePolygon(g['coordinates'][i]);
          }
          break;
      }
    }
    // process different types
    var i;
    if( !('type' in d) ) { return; }

    if( d['type'] == 'GeometryCollection' ) {
      for( i=0; i<d['geometries'].length; ++i ) {
        parseGeometry(d['geometries'][i]);
      }
    } else {
      parseGeometry(d);
    }
  }

  function processWIWOSM(d) {
    // process the returned data
    processGeoJSON(d,wmakml);

    // set up canvas
    if( wmakml.ways || wmakml.areas ) {
      addKMLCanvas();
      wmaDrawKML();
    }

    // zoom and center to wmakml data
    if( wmakml.maxlon && wmakml.minlon && wmakml.maxlat>-Infinity && wmakml.minlat < Infinity ) {
      var clon = ( wmakml.maxlon + wmakml.minlon )/2.0
        , clat = ( wmakml.maxlat + wmakml.minlat )/2.0
        , ex = (wmakml.maxlon - wmakml.minlon)/180.0 * 3.0*128 // TODO: Mercator is 1:1
        , ey = (wmakml.maxlat - wmakml.minlat)/180.0 * 3.0*128 // max extent in degrees, zoom0 has 3*128/180 px/degree
        , i;

      for( i = 0; i < 12; ++i ) {
        if( ex>wma_width/2 || ey>wma_height/2 ) break;
        ex *= 2; ey *= 2;
      }
      wmaSetZoom(i);
      wmaMoveToCoord( clat, clon );
    }
  }

  // wrapper to load a size comparison overlay object
  function processSizeOverlay(d) {
    var c = wmasize.c, canvas = wmasize.canvas;
    if( canvas ) {
      wmasize = { shown: true, drawn: false, canvas: canvas, c: c, ways: null, areas: null, maxlat: -Infinity, minlat: Infinity };
    } else {
      wmasize = { shown: true, drawn: false, canvas: null, c: null, ways: null, areas: null, maxlat: -Infinity, minlat: Infinity };
      addKMLCanvas(wmasize);
    }
    processGeoJSON(d,wmasize);
    
    // postprocess data
    var a=wmasize.areas, w=wmasize.ways, clon = ( wmasize.maxlon + wmasize.minlon )/2.0, clat = ( wmasize.maxlat + wmasize.minlat )/2.0
    function norm(w){
      var k, dx = 0.0;
      if(  w[0].lon < wmasize.minlon ) { dx = 360.0; }
      for( k = 0; k < w.length; ++k ) {
        w[k].lon -= clon-dx;
        w[k].lon *= Math.cos(w[k].lat/180*Math.PI);
        w[k].lat -= clat;
      }
    }
    if( a !== null ) {
      for( i = 0; i<a.length; i++ ) {
        for( j = 0; j<a[i].outer.length; ++j ) { norm(a[i].outer[j]); }
        for( j = 0; j<a[i].inner.length; ++j ) { norm(a[i].inner[j]); }
      }
    }
    if( w !== null ) {
      for(i =0; i<w.length; ++i ) { latNorm(w[i]); }
    }
    wmasize.canvas.fadeIn(200);
  }

  setupWidget();
};


// drop down menu class
function wmaMenu(rtl) {
  this.div = $('<div></div>').addClass('wmamenu').css('direction',(rtl===true?'rtl':''));
  this.parent = null;
  this.shown = false;
}
wmaMenu.prototype.addTitle = function(html,rtl) {
  var item = $('<div></div>').addClass('wmamenutitle').html(html)
    .css('direction',(rtl===true)?'rtl':'')
    .appendTo(this.div);
  return item;
}
wmaMenu.prototype.addItem = function(html,func,rtl) {
  func = func || (function(){});
  var that = this, item = $('<div></div>').addClass('wmamenuitem').html(html)
    .css('direction',(rtl===true)?'rtl':'')
    .mouseenter(function(){ item.css('background-color', '#AAA'); })
    .mouseleave(function(){ item.css('background-color', ''); })
    .click( function() { func(); that.close() } )
    .appendTo(this.div);
  return item;
}
wmaMenu.prototype.addMenu = function(html,menu,rtl) {
  var item = $('<div></div>')
    .addClass('wmasubmenu')
    .html(html)
    .css('direction',(rtl===true)?'rtl':'')
    .mouseenter(function(){ item.css('background-color', '#AAA'); })
    .mouseleave(function(){ item.css('background-color', ''); menu.hide(); })
    .click(function(){
      menu.move( item.width(), 0 );//item.height()/2);
      menu.show();
    })
    .append(menu.div)
    .appendTo(this.div);
  menu.parent = this;
  return item;
}
wmaMenu.prototype.addCheck = function(html,func,selected,rtl) {
  function check() {
    if( selected ) { item.addClass('wmamenuchecked'); } 
    else { item.removeClass('wmamenuchecked'); }
  }
  function click() {
    selected = !selected;
    check();
    func(selected);
  }
  var item = this.addItem(html,click,rtl);
  func = func || (function(){});
  check();
  return {
    toggle: function(state) {
      if( state === undefined ) {
        selected = !selected;
        check();
      }
    },
    check : check, item: item
  }
}
wmaMenu.prototype.addGroup = function(options,func,selected,rtl) {
  var items = {}, that = this, current = -1;
  function select(n) {
    if( n == current ) { return; }
    for( var i in items ) {
      if( i==n ) { items[i].addClass('wmamenuselected'); } 
      else { items[i].removeClass('wmamenuselected'); }
    }
    current = n;
  }
  function addOption(n,t){
    items[n] = that.addItem( t, function() { select(n); func(n); }, rtl );
  }
  selected = selected || 0;
  func = func || (function(){});
  for( var i=0; i<options.length; ++i ) {
    if( typeof options[i] === 'object' ) {
      addOption(options[i][0],options[i][1]);
    } else {
      addOption(i,options[i]);
    }
  }
  select(selected);
  return {
    items: items, select: select,
    current : function() {
      return current;
    },
    hide: function() {
      for( var i in items ) { items[i].hide(); }
    },
    show: function() {
      for( var i in items ) { items[i].show(); }
    }
  }
}
wmaMenu.prototype.addSep = function() { 
  this.div.children().last().css({
    'border-bottom-style': 'solid', 
    'border-bottom-width': '1px',
    'border-bottom-color': '#AAA'
  }); 
}
wmaMenu.prototype.show = function() { this.div.fadeIn(200); this.shown = true; }
wmaMenu.prototype.hide = function() { this.div.fadeOut(200); this.shown = false; }
wmaMenu.prototype.toggle = function() { this.shown?this.hide():this.show(); }
wmaMenu.prototype.close = function() { this.hide(); this.parent && this.parent.close(); }
wmaMenu.prototype.move = function(x,y) { this.div.css({top:y+'px',left:x+'px'}); }

