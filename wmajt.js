var wmajt = (function(){
  var w=128,h=128
    , minzoom = 12, buildingzoom = 14
    , cache = {}
    , ref_sd = {}, ref_z = {}
    , zbuild = {}
    , bx1,by1,bx2,by2,bw,bh // used by update and mouse pointer interaction (current tile coords)
    , dash = null
    , style = {
      Polygon: [
        ['natural',{ocean:1}, // actually it's land!
          [ { fillStyle: "rgb(250,250,208)" },
            { lineWidth: 1, strokeStyle: "rgb(125,125,104)"} ]
        ],
        ['railway',{platform:1},
          [ { fillStyle: "rgb(220,220,220)" } ]
        ],
        ['landuse',{industrial:1,retail:1,commercial:1,residential:1},
          [ { fillStyle: "rgb(208,208,208)" } ]
        ],
        ['landuse',{reservoir:1},
          [ { fillStyle: "rgb(200,200,224)" } ]
        ],
        ['landuse',{military:1,railway:1},
          [ { fillStyle: "rgb(224,200,200)" } ]
        ],
        ['landuse',{cemetery:1,recreation_ground:1},
          [ { fillStyle: "rgb(190,214,190)" } ]
        ],
        ['landuse',{grass:1},
          [ { globalAlpha: 0.3, fillStyle: "rgb(0,160,0)" }, { globalAlpha:1} ]
        ],
        ['leisure',{park:1,orchard:1,meadow:1,village_green:1,golf_course:1,track:1,
          forrest:1,recreation_ground:1,dog_park:1,garden:1,pitch:1,stadium:1},
          [ { fillStyle: "rgb(200,224,200)" } ]
        ],
        ['waterway',{riverbank:1,dock:1},
          [ { fillStyle: "rgb(158,199,243)" } ]
        ],
        ['natural',{beach:1},
          [ { fillStyle: "rgb(224,224,200)" } ]
        ],
        ['natural',{wetland:1,mud:1},
          [ { fillStyle: "rgb(200,218,224)" } ]
        ],
        ['natural',{grassland:1,fell:1},
          [ { fillStyle: "rgb(200,224,200)" } ]
        ],
        ['natural',{scrub:1},
          [ { fillStyle: "rgb(150,214,150)" } ]
        ],
        ['natural',{wood:1},
          [ { fillStyle: "rgb(100,204,100)" } ]
        ],
        ['natural',{water:1,bay:1},
          [ { fillStyle: "rgb(158,199,243)" },
            { lineWidth: 1, strokeStyle: "rgb(158,199,243)"} ]
        ],
        ['natural',{glacier:1},
          [ { fillStyle: "rgb(230,245,255)" },
            { lineWidth: 1, strokeStyle: "rgb(255,255,255)"} ]
        ],
        ['amenity',{university:1},
          [ { lineWidth:0.5, strokeStyle: "rgb(240,225,183)" } ]
        ],
        ['amenity',{parking:1},
          [ { fillStyle: "rgb(240,235,193)" } ]
        ],
        ['highway',{pedestrian:1},
          [ { fillStyle: "rgb(255,255,255)" },
            { lineWidth: 2, strokeStyle: "rgb(168,148,148)" } ]
        ],
        ['tourism',true,
          [ { dash: [3,3], lineWidth: 2, strokeStyle: "rgb(255,255,0)" } ]
        ],
        ['aeroway',{terminal:1},
          [ { fillStyle: "rgb(190,210,190)" },
            { lineWidth: 1, strokeStyle: "rgb(127,137,127)" } ]
        ],
        ['historic',{memorial:1,monument:1,fort:1,castle:1},
          [ { fillStyle: "rgb(255,190,190)" },
            { lineWidth: 1, strokeStyle: "rgb(167,120,120)" } ]
        ],
        ['historic',{ship:1,wreck:1},
          [ { fillStyle: "rgb(255,190,235)" } ]
        ],
        ['railway',{station:1},
          [ { fillStyle: "rgb(210,195,195)" },
            { lineWidth: 1, strokeStyle: "rgb(127,127,127)" } ]
        ],
        ['natural',{water:1,bay:1},
          [ { fillStyle: "rgb(158,199,243)" },
            { lineWidth: 1, strokeStyle: "rgb(158,199,243)"} ]
        ],
        /*['building',{yes:1,block:1,office:1,courthouse:1,church:1,school:1,cathedral:1,residential:1,house:1,hut:1,
          university:1,hospital:1,bunker:1,train_station:1,chapel:1,industrial:1,commercial:1,retail:1,hotel:1,
          apartments:1,synagogue:1},
          [ { fillStyle: "rgb(200,200,200)" },
            { lineWidth: 1, strokeStyle: "rgb(127,127,127)" } ]
        ],*/
        ['building',true,
          [ { fillStyle: "rgb(200,200,200)" },
            { lineWidth: 1, strokeStyle: "rgb(127,127,127)" } ]
        ],
        ['building:part',true,
          [ { fillStyle: "rgb(200,200,200)" },
            { lineWidth: 1, strokeStyle: "rgb(127,127,127)" } ]
        ],
        /*['building:height',true,
          [ { lineWidth: 5, strokeStyle: "rgb(255,0,0)" } ]
        ],
        ['building:levels',true,
          [ { lineWidth: 3, strokeStyle: "rgb(0,255,0)" } ]
        ],
        ['building:min_level',true,
          [ { lineWidth: 1.5, strokeStyle: "rgb(0,0,255)" } ]
        ],*/
        ['start_date',true,
          [ { dash: [2,5], lineWidth: 3, strokeStyle: "rgb(255,0,0)" } ]
        ]
      ],
      LineString: [
        ['waterway',{canal:1},
          [ { lineCap: 'butt', lineWidth: 3, strokeStyle: "rgb(158,199,243)" } ]
        ],
        ['waterway',{river:1},
          [ { lineWidth: 1.5, strokeStyle: "rgb(126,159,194)" } ]
        ],
        ['waterway',{stream:1},
          [ { dash: [2,2], lineWidth: 1.5, strokeStyle: "rgb(126,159,194)" } ]
        ],
        ['route',{ferry:1},
          [ { dash: [4,4], lineWidth: 2, strokeStyle: "rgb(126,159,194)" } ]
        ],
        ['highway',{pedestrian:1},
          [ { lineWidth: 5, strokeStyle: "rgb(255,255,255)" } ]
        ],
        ['highway',{footway:1,pedestrian:1,path:1},
          [ { lineWidth: 2, strokeStyle: "rgb(198,178,178)" } ]
          //[ { lineWidth: 2, strokeStyle: "rgb(168,148,148)" } ]
        ],
        ['highway',{steps:1},
          [ { dash:[1.5,1.5], lineWidth: 3, strokeStyle: "rgb(168,148,148)" } ]
        ],
        ['highway',{service:1},
          [ { lineWidth: 4, strokeStyle: "rgb(168,168,168)" },
            { lineWidth: 2.5, strokeStyle: "rgb(208,208,208)" } ]
        ],
        ['highway',{track:1},
          [ { lineWidth: 3.5, strokeStyle: "rgb(168,168,168)" },
            { lineWidth: 2.5, strokeStyle: "rgb(250,250,208)" } ]
        ],
        ['highway',{residential:1,unclassified:1},
          [ { lineWidth: 4, strokeStyle: "rgb(200,200,200)" },
            { lineWidth: 2.5, strokeStyle: "rgb(255,255,255)" } ]
        ],
        ['highway',{tertiary:1},
          [ { lineWidth: 5, strokeStyle: "rgb(200,200,200)" },
            { lineWidth: 3.5, strokeStyle: "rgb(255,255,235)" } ]
        ],
        // border
        ['railway',{subway:1},
          [ { globalAlpha: 0.2, lineWidth: 3, strokeStyle: "rgb(100,100,100)" },
            { globalAlpha: 1 } ]
        ],
        ['railway',{rail:1,preserved:1,monorail:1,narrow_gauge:1},
          [ { lineWidth: 3, strokeStyle: "rgb(100,100,100)" } ]
        ],
        ['highway',{secondary:1,secondary_link:1,primary:1,primary_link:1},
          [ { lineCap: 'round', lineWidth: 6, strokeStyle: "rgb(171,158,137)" } ]
        ],
        ['highway',{motorway:1,motorway_link:1,trunk:1,trunk_link:1},
          [ { lineWidth: 7, strokeStyle: "rgb(188,149,28)" } ]
        ],
        ['aeroway',{runway:1},
          [ { lineWidth: 10, strokeStyle: "rgb(100,130,100)" } ]
        ],
        ['aeroway',{taxiway:1},
          [ { lineWidth: 4.5, strokeStyle: "rgb(100,130,100)" } ]
        ],
        // fill
        ['railway',{subway:1},
          [ { lineCap: 'butt', globalAlpha: 0.3, dash: [3,3], lineWidth: 1.5, strokeStyle: "rgb(255,255,255)" },
            { globalAlpha: 1 } ]
        ],
        ['railway',{rail:1,narrow_gauge:1},
          [ { dash: [3,3], lineWidth: 1.5, strokeStyle: "rgb(255,255,255)" } ]
        ],
        ['railway',{preserved:1},
          [ { dash: [3,3], lineWidth: 1.5, strokeStyle: "rgb(200,200,200)" } ]
        ],
        ['railway',{monorail:1},
          [ { dash: [1,2,4,2], lineWidth: 1.5, strokeStyle: "rgb(200,200,200)" } ]
        ],
        ['highway',{secondary:1,secondary_link:1},
          [ { lineCap: 'round', lineWidth: 4.5, strokeStyle: "rgb(255,250,115)" } ]
        ],
        ['highway',{primary:1,primary_link:1},
          [ { lineWidth: 4, strokeStyle: "rgb(255,230,95)" } ]
        ],
        ['highway',{motorway:1,motorway_link:1,trunk:1,trunk_link:1},
          [ { lineWidth: 5, strokeStyle: "rgb(242,191,36)" } ]
        ],
        ['aeroway',{runway:1},
          [ { lineWidth: 8, strokeStyle: "rgb(150,180,150)" } ]
        ],
        ['aeroway',{taxiway:1},
          [ { lineWidth: 2.5, strokeStyle: "rgb(150,180,150)" } ]
        ],
        ['railway',{tram:1},
          [ { globalAlpha: 0.4, dash: [3,3], lineWidth: 1.5, strokeStyle: "rgb(0,0,0)" },
            { globalAlpha: 1 } ]
        ],
        // access overlay
        ['access',{permissive:1},
          [ { dash: [1,2], lineWidth: 1, strokeStyle: "rgb(100,200,100)" } ]
        ],
        ['access',{'private':1,residents:1},
          [ { dash: [1,2], lineWidth: 1, strokeStyle: "rgb(200,100,100)" } ]
        ],
        ['building:part',true,
          [ { lineWidth: 1, strokeStyle: "rgb(127,127,255)" } ]
        ],
        ['start_date',true,
          [ { dash: [2,5], lineWidth: 3, strokeStyle: "rgb(255,0,0)" } ]
        ]
      ]
    };  

  function hash(x,y,z) {
    return x+'_'+y+'_'+z;
  }

  function gotData(data) {
    // insert response into cache
    if( data === null ) return; // server error
    d = data.data;

    // TODO sort accorsing to layer and tunnel flag (but that kills the index!)
    var idx, lay={0:1}, d, i, j;

    // index of objects by tag
    if( data.v && data.v >= 2 ) {
      idx = data.idx;
    } else {
      // generate index client side
      idx = {};
      for(i=0; i<d.length; ++i ) {
        for( j in d[i].tags ) {
          if( j in idx ) {
            idx[j].push(i);
          } else {
            idx[j] = [i];
          }
        }
      }
    }

    // list of all layers in this tile
    for(i=0; i<d.length; ++i ) {
      if( 'layer' in d[i].tags ) { lay[d[i].tags['layer']]=1; }
    }

    // build cache entry
    cache[hash(data.x,data.y,data.z)] = { data: data.data, building: {}, f: data.f||{}, idx: idx, lay: lay };

    // propagate buildings to low zoom levels above the building threshold
    var d=data.data, zz, xx=data.x, yy=data.y, ca;
    if( data.z >= buildingzoom ) {
      for( zz=data.z; zz>=minzoom; zz-- ) {
        ca = cache[hash(xx,yy,zz)];
        if( zz<buildingzoom && ca && ca.data  ) {
          // iterate over all data entries and insert buildings into higher cache level
          for(i =0; i<d.length; ++i ) {
            // check against shape type and tags
            if( 'osm_id' in d[i].tags && 
                ( 'building' in d[i].tags || 'building:part' in d[i].tags ) &&
                !(d[i].tags['osm_id'] in ca.building) ) {
              // update the index
              for( j in d[i].tags ) {
                if( j in ca.idx ) {
                  ca.idx[j].push(ca.data.length);
                } else {
                  ca.idx[j] = [ca.data.length];
                }
              }
              ca.data.push(d[i]);
              ca.building[d[i].tags['osm_id']] = 1;
            }
          }
        }
        xx=Math.floor(xx/2);
        yy=Math.floor(yy/2);
      }
    } else {
      // TODO: look for lower zoom levels with building data, but there may be A LOT!
      // SOLUTION: just look at building zoom
    }

    // (re-)draw the tile
    update(this.csx,this.csy,this.csz,this);
  }

  // create path from coordinate data in g
  function drawPath(g,c) {
    if( dash ) {
      // iterate over all nodes
      if( g.length > 0 ) {
        var px = (g[0][0]-bx1)*128.0/bw
          , py = 128.0-(g[0][1]-by1)*128.0/bh
          , dx, dy, di=0,dl=dash.length,dc=0.0
          , mx, my, r, rr, j, done;
        for( j=1; j<g.length; ++j ) {
          // move to start
          c.moveTo(px,py);
          rr = -dc;

          // destination point   
          dx = (g[j][0]-bx1)*128.0/bw;
          dy = 128.0-(g[j][1]-by1)*128.0/bh;

          // stepvector and length
          mx = dx-px;
          my = dy-py;
          r = Math.sqrt(mx*mx+my*my);
          mx /= r;
          my /= r;

          // loop over segment
          done = false;
          while(true) {
            rr += dash[di];
            if( rr>r ) {
              done=true;
              dc = rr-r;
              rr = r;
            }
            c[di%2?'moveTo':'lineTo'](rr*mx+px,rr*my+py);
            if(done) break;
            di=(di+1)%dl;
          }

          // new starting point
          px=dx;
          py=dy;
        }
      }
    } else {
      // iterate over all nodes
      if( g.length > 0 ) {
        c.moveTo((g[0][0]-bx1)*128/bw,128-(g[0][1]-by1)*128/bh);
        for( j=1; j<g.length; ++j ) {
          c.lineTo((g[j][0]-bx1)*128/bw,128-(g[j][1]-by1)*128/bh);
        }
      }
    }
  }

  // detect mouse pointer proximity
  function detectPointer( e, tile ) {
    var rmin = null, mmin = {}
      , o = tile.div.offset()
      , mx = e.pageX - o.left
      , my = e.pageY - o.top
      , d = tile.csca.data || []
      , m, i, t, s = '';

    function detectPath(g,c,m) {
      var px, py, r;

      // iterate over all nodes
      for( j=1; j<g.length; ++j ) {
        px = (g[j][0]-bx1)*128/bw - mx;
        py = 128-(g[j][1]-by1)*128/bh - my;
        r = px*px + py*py;
        if( ( rmin === null || r<rmin ) && ( 'name' in m.tags || 'addr:street' in m.tags ) ) {
          rmin = r;
          mmin = m;
        }
      }
    }

    // set globals for current tile coordinates
    bx1 = tile.csx*60.0/(1<<tile.csz)
    by1 = 90.0 - ( ((tile.csy+1.0)*60.0) / (1<<tile.csz) )
    bx2 = (tile.csx+1) * 60.0 / (1<<tile.csz)
    by2 = 90.0 - ( (tile.csy*60.0) / (1<<tile.csz) )
    bw = bx2-bx1
    bh = by2-by1
    if(bx1>180.0) bx1-=360;

    // loop over tag index objects 
    for(i =0; i<d.length; ++i ) {
      m = d[i];
      processShape(m,'Polygon',null,detectPath);
      if( m.geo.type == 'GeometryCollection'  ) {
        processShape(m,'Line',null,detectPath);
      }
    }

    t = mmin.tags || {};
//console.log(t);
    // has name
    if( 'name' in t ) { 
      s = t.name; 
      if( 'loc_name' in t ) {
        s += ' "' + t.loc_name + '"';
      }
      if( 'artist_name' in t ) {
        s += ' (' + t.artist_name + ')';
      }
      return s;
    } 

    // has address
    if( 'addr:street' in t ) {
      s = t['addr:street'];
      if( 'addr:housenumber' in t ) {
        s = t['addr:housenumber'] + ' ' + s;
      }
      return s;
    }

    // misc 
    var tags = ['landuse','historic','highway','building'];
    for( i=0; i<tags.length; ++i ) {
      if( tags[i] in t ) return tags[i] + ' ' + t[tags[i]];
    }

    return null;
  }

  // quick hack for shape type
  function processShape(m,s,c,path) {
    var k, l, g;
    switch(m.geo.type) {
      case 'Polygon':
        // TODO 
        path( m.geo.coordinates[0],c,m );
        break;
      case 'LineString':
        path( m.geo.coordinates,c,m );
        break;
      case 'MultiLineString':
        for(k=0; k<m.geo.coordinates.length; k++ ) {
          path( m.geo.coordinates[k],c,m );
        }
        break;
      case 'MultiPolygon':
        for(k=0; k<m.geo.coordinates.length; k++ ) {
          path( m.geo.coordinates[k][0],c,m );
        }
        break;
      case 'GeometryCollection':
        g = m.geo.geometries;
        for( l=0; l<g.length; l++ ) {
          if( s === 'Polygon' ) {
            switch(g[l].type) {
              case 'Polygon':
                // TODO 
                path( g[l].coordinates[0],c,m );
                break;
              case 'MultiPolygon':
                for(k=0; k<g[l].coordinates.length; k++ ) {
                  path( g[l].coordinates[k][0],c,m );
                }
                break;
            }
          } else {
            switch(g[l].type) {
              case 'LineString':
                path( g[l].coordinates,c,m );
                break;
              case 'MultiLineString':
                for(k=0; k<g[l].coordinates.length; k++ ) {
                  path( g[l].coordinates[k],c,m );
                }
                break;
            }
          }
        }
        break;
    }
  }

  function update(x,y,z,tile,purge) {
    var c = tile.ctx;

    // set globals for current tile coordinates
    bx1 = x*60.0/(1<<z)
    by1 = 90.0 - ( ((y+1.0)*60.0) / (1<<z) )
    bx2 = (x+1) * 60.0 / (1<<z)
    by2 = 90.0 - ( (y*60.0) / (1<<z) )
    bw = bx2-bx1
    bh = by2-by1
    if(bx1>180.0) bx1-=360;

    // draw the data
    function drawGeoJSON(ca) {
      var i, j, k, g, s, o, d = ca.data, m, idx;

      c.lineWidth = 1.0;

      // TODO: handle coastlines properly!!
      c.fillStyle = 'rgb(158,199,243)';
      c.fillRect(0,0,128,128);

      for( s in style ) {
        for( o=0; o < style[s].length; o++ ) {
          c.beginPath();
         
          // skip styles whose tag does not occur
          if( !(style[s][o][0] in ca.idx) ) continue;

          // set dash style global
          dash = style[s][o][2][0].dash || null;

          // loop over tag index objects 
          idx = ca.idx[style[s][o][0]];
          for(i =0; i<idx.length; ++i ) {
            m = d[idx[i]];
            // check against shape type and tags
            if( ( s !== m.geo.type && ("Multi"+s) !== m.geo.type && m.geo.type !== 'GeometryCollection' ) ||
                !( style[s][o][1]===true || m.tags[style[s][o][0]] in style[s][o][1] ) ) continue;

            processShape(m,s,c,drawPath);
          }

          // iterate over the style components
          g = style[s][o][2]
          for( i=0; i<g.length; i++ ) {
            for( j in g[i] ) { if(j!='dash') { c[j] = g[i][j]; } }
            if( 'strokeStyle' in g[i] ) {
              c.stroke();
            }
            if( 'fillStyle' in g[i] ) {
              c.fill();
            }
          }
        }
      }

    }

    // store coords in tile context
    tile.csx = x;
    tile.csy = y;
    tile.csz = z;

    // seach cache for data
    var zz, xx=x, yy=y, ca, d,v, idx, trackstartdate = false;
    for( zz=z; zz>=minzoom; zz-- ) {
      ca = cache[hash(xx,yy,zz)];
      if( ca && ca.data && !purge ) {
        // subtract old tile from reference counters
        if( tile.csca ) {
          d = tile.csca.data;
          if( trackstartdate && 'start_date' in tile.csca.idx ) {
            idx = tile.csca.idx['start_date']
            for(i=0; i<idx.length; ++i ) {
              v = d[idx[i]].tags['start_date'];
              if( v in ref_sd ) {
                ref_sd[v]--;
                if(ref_sd[v]==0) delete ref_sd[v];
              } 
            }
          }
          // union index
          if( z>buildingzoom ) {
            idx = _.union( tile.csca.idx['building:levels']||[], tile.csca.idx['height']||[] );
            //if( z>buildingzoom && 'building:levels' in tile.csca.idx ) {
            //  idx = tile.csca.idx['building:levels']
            for(i=0; i<idx.length; ++i ) {
              if( 'osm_id' in d[idx[i]].tags ) {
                v = d[idx[i]].tags['osm_id'];
                if( v in ref_z ) {
                  ref_z[v]--;
                  if(ref_z[v]==0) delete ref_z[v];
                } 
              }
            }
          }
        }

        // draw tile contents
        drawGeoJSON(ca);

        // link current cache object to current tile
        tile.csca = ca;

        // add to reference counters 
        d = ca.data;
        // this maintains a list of all distinct start dates in the current field of view
        if( trackstartdate && 'start_date' in ca.idx ) {
          idx = ca.idx['start_date']
          for(i=0; i<idx.length; ++i ) {
            v = d[idx[i]].tags['start_date'];
            ref_sd[v] = (ref_sd[v]||0) + 1;
          }
        }
        // this maintains a list of all buildings with height data  in the field of view
        // and a lookup table of buildings by osm_id
        //if( z>buildingzoom && 'building:levels' in ca.idx ) {
        // union index
        if( z>buildingzoom ) {
          idx = _.union( ca.idx['building:levels']||[], ca.idx['height']||[] );
          //idx = ca.idx['building:levels']
          for(i=0; i<idx.length; ++i ) {
            if( 'osm_id' in d[idx[i]].tags ) {
              v = d[idx[i]].tags['osm_id'];
              ref_z[v] = (ref_z[v]||0) + 1;
              if( !(v in zbuild ) ) {
                zbuild[v] = d[idx[i]];
              }
            }
          }
        }
        
        tile.can.show();
        if( z< buildingzoom || zz >= buildingzoom ) return;
      }
      xx=Math.floor(xx/2);
      yy=Math.floor(yy/2);
    } 

    // request data
    tile.debug.html('tiles/jsontile.php?x='+x+'&y='+y+'&z='+z);
    $.ajax({
      url: 'tiles/jsontile.php?x='+x+'&y='+y+'&z='+z+(purge===true?'&action=purge':''),
      dataType: 'json',
      success: gotData,
      context: tile
    });
  }

  return {
    update: update,
    detectPointer: detectPointer,
    ref_z : function() {
      return ref_z;
    },
    zbuild : function() {
      return zbuild;
    }
  }
})();
