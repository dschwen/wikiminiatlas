var Polygon= [
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
        ['natural',{beach:1,sand:1},
          [ { fillStyle: "rgb(250,242,175)" } ]
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
        ]
        /*['building:height',true,
          [ { lineWidth: 5, strokeStyle: "rgb(255,0,0)" } ]
        ],
        ['building:levels',true,
          [ { lineWidth: 3, strokeStyle: "rgb(0,255,0)" } ]
        ],
        ['building:min_level',true,
          [ { lineWidth: 1.5, strokeStyle: "rgb(0,0,255)" } ]
        ],
        ['start_date',true,
          [ { dash: [2,5], lineWidth: 3, strokeStyle: "rgb(255,0,0)" } ]
        ]*/
      ];
var LineString = [
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
        ]
        /*['start_date',true,
          [ { dash: [2,5], lineWidth: 3, strokeStyle: "rgb(255,0,0)" } ]
        ]*/
      ];

var l = {
  lineWidth: 'line-width',
  strokeStyle: 'line-color',
  fillStyle: 'polygon-fill',
  dash: 'line-dasharray'
};

function listStyles( id, a ) {
  var i,j,t='',o,p;
  for( i=0; i<a.length; ++i ) {
    t += id+' [zoom>8]';
    o = a[i][1];
    if( o === true ) {
        t += '['+a[i][0]+'!=\'\']';
    } else {
      for( j in o ) {
        t += '['+a[i][0]+'=\''+j+'\']';
      }
    }
    t += '{\n';
    o = a[i][2][0];
    p = [];
    for( j in o ) {
      if( j in l ) {
        p.push( '  '+l[j]+': '+ ( typeof o[j] == 'Array' ? o[j].join(',') : o[j] ) );
      }
    }
    t += p.join(';\n') + '\n}\n'
  }
  console.log(t);
}

listStyles('#polygon',Polygon);
listStyles('#line',LineString);
