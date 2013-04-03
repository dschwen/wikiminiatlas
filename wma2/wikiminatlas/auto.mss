/*#polygon::sub0 [zoom>12][natural='ocean']{
  polygon-fill: rgb(250,250,208)
}*/
@farm: rgb(224,224,200);
@grassgreen: rgb(190,234,190);

#polygon::sub1 [zoom>12][railway='platform']{
  polygon-fill: rgb(220,220,220)
}

#polygon::landuse [zoom>=12][landuse!=''] {
  [landuse='industrial'],[landuse='retail'],
  [landuse='commercial'],[landuse='residential'] {
    polygon-fill: @builtup;
  }
  [landuse='reservoir'],[landuse='basin'] {
    polygon-fill: rgb(200,200,224)
  }
  [landuse='conservation'] {
    polygon-fill: rgb(200,255,200)
  }
  [zoom>=13] {
    [landuse='military'],[landuse='railway'],[landuse='prison'] {
      polygon-fill: rgb(224,200,200)
    }
    [landuse='farm'],[landuse='farmland'],[landuse='farmyard'] {
      polygon-fill: @farm;
      [landuse='farm'],[landuse='farmland'] { polygon-opacity: 0.5 }
    }
    [landuse='quarry'] {
      polygon-fill: @builtup;
      polygon-opacity: 0.5;
    }
    [landuse='cemetery'],[landuse='recreation_ground'] {
      polygon-fill: rgb(190,214,190)
    }
    [landuse='grass'] {
  	  polygon-fill: @grassgreen;
    }
  }
}

#line::barrier [zoom>=14][barrier!=''] {
  line-width: 0.5;
  [zoom<=15] { line-opacity: 0.5 }
}

#polygon::boundaries [zoom>=11][boundary='administrative'] {
  [admin_level='2'],[admin_level='4'] {
    line-width: 1.5;
    line-opacity: 0.35;
    line-dasharray: 1.5,1.5,4.0,1.5;
    [admin_level='4'] { line-dasharray: 4.0,1.5; }
  }
}

#polygon::greens [zoom>=12][leisure!=''] {
  [leisure='park'],[leisure='orchard'],[leisure='meadow'],
  [leisure='village_green'],[leisure='forrest'],[leisure='garden'] {
  	polygon-fill: @grassgreen;
  }
}

#polygon::sub7b [zoom>12] {
  [leisure='golf_course'],[leisure='track'],[leisure='recreation_ground'],
  [leisure='dog_park'],[leisure='pitch'],[leisure='stadium'] {
  	polygon-fill: rgb(100,255,100);
    line-color: darken(rgb(190,234,190),30%);
    opacity: 0.25;
  }
}
#polygon::sub8 [zoom>=12][waterway='riverbank'],
#polygon::sub8 [zoom>=12][waterway='dock']{
  polygon-fill: rgb(158,199,243)
}

#polygon::natural [zoom>=12][natural!=''] {
  [natural='beach'],[natural='sand'],[natural='desert'] {
    polygon-fill: rgb(250,242,175);
    [natural='desert'] { polygon-opacity: 0.5 }
  }
  [natural='wetland'],[natural='mud'] {
    polygon-fill: @swamp;
  }
  [natural='grassland'],[natural='fell'] {
    polygon-fill: @grass;
  }
  [natural='scrub'] {
    polygon-fill: rgb(150,214,150)
  }
  [natural='wood'] {
    polygon-fill: @trees;
  }
  [natural='water'],[natural='bay'] {
    polygon-fill: @ocean;
  }
  [natural='glacier'] {
    polygon-fill: rgb(230,245,255)
  }
}

#polygon::sub16 [zoom>12][amenity='university']{
  line-width: 0.5;
  line-color: rgb(240,225,183)
}
#polygon::sub17 [zoom>12][amenity='parking']{
  polygon-fill: rgb(240,235,193)
}
#polygon::sub18 [zoom>=14][highway='pedestrian']{
  polygon-fill: rgb(255,255,255)
}
#polygon::sub19 [zoom>=14][tourism!='']{
  line-dasharray: 3,3;
  line-width: 2;
  line-color: rgb(255,255,0)
}

#polygon::sub20 [zoom>12][aeroway='terminal']{
  polygon-fill: rgb(190,210,190)
}
#polygon::sub21 [zoom>12][historic='memorial'],
#polygon::sub21 [zoom>12][historic='monument'],
#polygon::sub21 [zoom>12][historic='fort'],
#polygon::sub21 [zoom>12][historic='castle']{
  polygon-fill: rgb(255,190,190)
}
#polygon::sub22 [zoom>=14][historic='ship'],
#polygon::sub22 [zoom>=14][historic='wreck']{
  polygon-fill: rgb(255,190,235)
}
#polygon::sub23 [zoom>=13][railway='station']{
  polygon-fill: rgb(210,195,195)
}

#buildings [zoom>=14][building!='']{
  polygon-fill: rgb(170,170,170);
  polygon-opacity: 0.7;
  [zoom=16] {
    line-width: 1;
    line-color: rgb(120,120,120);
    line-opacity: 0.5;
  }
  [zoom>=17] {
    line-color: rgb(120,120,120);
    line-opacity: 0.75;
  }
}
/*#polygon::sub26 [zoom>12][building:part!='']{
  polygon-fill: rgb(200,200,200)
}*/

#line::sub0 [zoom>=12][waterway='canal']{
  line-width: 3;
  line-color: @ocean;
}
#line::sub1 [zoom>=12][waterway='river']{
  line-width: 1.5;
  line-color: @ocean;
}
#line::sub2 [zoom>=12][waterway='stream']{
  line-dasharray: 2,2;
  line-width: 1.5;
  line-color: @ocean;
}
#line::sub3 [zoom>12][route='ferry']{
  line-dasharray: 4,4;
  line-width: 2;
  line-color: rgb(126,159,194)
}

#line::sub6 [zoom>=16][highway='steps']{
  line-dasharray: 1.5,1.5;
  line-width: 3;
  line-color: rgb(168,148,148)
}




@aeroway: rgb(110,130,110);

#line::sub15 [zoom>=12][aeroway='runway']{
  line-width: 10;
  [zoom=12] { line-width: 8 }
  [zoom=13] { line-width: 9 }
  line-cap: round;
  line-color: @aeroway;
}
#line::sub16 [zoom>=13][aeroway='taxiway']{
  line-width: 4.5;
  line-cap: round;
  line-color: @aeroway;
}


@aeroway_color: rgb(150,180,150);

#line::sub24 [zoom>=12][aeroway='runway']{
  line-width: 8;
  line-cap: round;
  line-color: rgb(150,180,150)
}
#line::sub25 [zoom>=13][aeroway='taxiway']{
  line-width: 2.5;
  line-cap: round;
  line-color: rgb(150,180,150)
}
#polygon::apron [zoom>=15][aeroway='apron']{
  polygon-fill: 0.25*@aeroway_color + 0.75*rgb(250,250,208);
}

#line::cliff [zoom>=16][natural='cliff'] {
  line-pattern-file: url(cliff_line.png);
}

/*#line::sub29 [zoom>12][building:part!='']{
  line-width: 1;
  line-color: rgb(127,127,255)
}*/
