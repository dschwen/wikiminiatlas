#polygon::sub0 [zoom>12][natural='ocean']{
  polygon-fill: rgb(250,250,208)
}
#polygon::sub1 [zoom>12][railway='platform']{
  polygon-fill: rgb(220,220,220)
}
#polygon::sub2 [zoom>12][landuse='industrial'],
#polygon::sub2 [zoom>12][landuse='retail'],
#polygon::sub2 [zoom>12][landuse='commercial'],
#polygon::sub2 [zoom>12][landuse='residential']{
  polygon-fill: rgb(208,208,208)
}
#polygon::sub3 [zoom>12][landuse='reservoir']{
  polygon-fill: rgb(200,200,224)
}
#polygon::sub4 [zoom>12][landuse='military'],
#polygon::sub4 [zoom>12][landuse='railway']{
  polygon-fill: rgb(224,200,200)
}
#polygon::sub5 [zoom>12][landuse='cemetery'],
#polygon::sub5 [zoom>12][landuse='recreation_ground']{
  polygon-fill: rgb(190,214,190)
}
#polygon::sub6 [zoom>12][landuse='grass']{
  polygon-fill: rgb(0,160,0)
}
#polygon::sub7 [zoom>12] {
  [leisure='park'],[leisure='orchard'],[leisure='meadow'],[leisure='village_green'],
  [leisure='forrest'] {
  	polygon-fill: rgb(190,234,190)
  }
}
#polygon::sub7b [zoom>12] {
  [leisure='golf_course'],[leisure='track'],[leisure='recreation_ground'],
  [leisure='dog_park'],[leisure='pitch'],[leisure='stadium'] {
  	polygon-fill: rgb(100,255,100);
    opacity: 0.2;
  }
}
#polygon::sub8 [zoom>12][waterway='riverbank'],
#polygon::sub8 [zoom>12][waterway='dock']{
  polygon-fill: rgb(158,199,243)
}
#polygon::sub9 [zoom>12][natural='beach'],
#polygon::sub9 [zoom>12][natural='sand']{
  polygon-fill: rgb(250,242,175)
}
#polygon::sub10 [zoom>12][natural='wetland'],
#polygon::sub10 [zoom>12][natural='mud']{
  polygon-fill: rgb(200,218,224)
}
#polygon::sub11 [zoom>12][natural='grassland'],
#polygon::sub11 [zoom>12][natural='fell']{
  polygon-fill: rgb(200,224,200)
}
#polygon::sub12 [zoom>12][natural='scrub']{
  polygon-fill: rgb(150,214,150)
}
#polygon::sub13 [zoom>12][natural='wood']{
  polygon-fill: rgb(100,204,100)
}
#polygon::sub14 [zoom>12][natural='water'],
#polygon::sub14 [zoom>12][natural='bay']{
  polygon-fill: rgb(158,199,243)
}
#polygon::sub15 [zoom>12][natural='glacier']{
  polygon-fill: rgb(230,245,255)
}
#polygon::sub16 [zoom>12][amenity='university']{
  line-width: 0.5;
  line-color: rgb(240,225,183)
}
#polygon::sub17 [zoom>12][amenity='parking']{
  polygon-fill: rgb(240,235,193)
}
#polygon::sub18 [zoom>12][highway='pedestrian']{
  polygon-fill: rgb(255,255,255)
}
#polygon::sub19 [zoom>12][tourism!='']{
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
#polygon::sub22 [zoom>12][historic='ship'],
#polygon::sub22 [zoom>12][historic='wreck']{
  polygon-fill: rgb(255,190,235)
}
#polygon::sub23 [zoom>12][railway='station']{
  polygon-fill: rgb(210,195,195)
}
#polygon::sub24 [zoom>12][natural='water'],
#polygon::sub24 [zoom>12][natural='bay']{
  polygon-fill: rgb(158,199,243)
}
#polygon::sub25 [zoom>12][building!='']{
  polygon-fill: rgb(200,200,200)
}
/*#polygon::sub26 [zoom>12][building:part!='']{
  polygon-fill: rgb(200,200,200)
}*/

#line::sub0 [zoom>12][waterway='canal']{
  line-width: 3;
  line-color: rgb(158,199,243)
}
#line::sub1 [zoom>12][waterway='river']{
  line-width: 1.5;
  line-color: rgb(126,159,194)
}
#line::sub2 [zoom>12][waterway='stream']{
  line-dasharray: 2,2;
  line-width: 1.5;
  line-color: rgb(126,159,194)
}
#line::sub3 [zoom>12][route='ferry']{
  line-dasharray: 4,4;
  line-width: 2;
  line-color: rgb(126,159,194)
}
#line::sub4 [zoom>12][highway='pedestrian']{
  line-width: 5;
  line-color: rgb(255,255,255)
}
#line::sub5 [zoom>12][highway='footway'],
#line::sub5 [zoom>12][highway='pedestrian'],
#line::sub5 [zoom>12][highway='path']{
  line-width: 2;
  line-color: rgb(198,178,178);
  [tunnel!=''] { line-dasharray: 4,4 }
}
#line::sub6 [zoom>12][highway='steps']{
  line-dasharray: 1.5,1.5;
  line-width: 3;
  line-color: rgb(168,148,148)
}
#line::sub7 [zoom>12][highway='service']{
  line-cap: round;
  ::outline { 
    line-width: 4;
  	line-color: rgb(188,188,188);
  	[tunnel!=''] { line-dasharray: 4,4 }
  }
  ::fill {
    line-width: 4;
  	line-color: #fff;
  	[tunnel!=''] { line-opacity: 0.5 }
  }
}
#line::sub8 [zoom>12][highway='track']{
  line-width: 3.5;
  line-color: rgb(168,168,168);
  [tunnel!=''] { line-dasharray: 4,4 }
}

#line::sub9 [zoom>12][highway='residential'],
#line::sub9 [zoom>12][highway='unclassified']{
  ::bridge [bridge!=''] {
    line-width: 6;
    [zoom>=15] { line-width: 6 + 1 }
    [zoom>=16] { line-width: 6 + 2 }
    line-color: #333;
    line-opacity: 0.5;
  }
  ::outline { 
    line-cap: round;
    line-width: 4;
    [zoom>=15] { line-width: 4 + 1 }
    [zoom>=16] { line-width: 4 + 2 }
    line-color: rgb(200,200,200);
    [tunnel!=''] { line-dasharray: 4,4 }
  }
  ::fill {
    line-cap: round;
    line-width: 3;
    [zoom>=15] { line-width: 3 + 1 }
    [zoom>=16] { line-width: 3 + 2 }
    line-color: #ffffff;
    [tunnel!=''] { line-opacity: 0.5; }
  }
}

#line::sub10 [zoom>12][highway='tertiary']{
  ::bridge [bridge!=''] {
    line-width: 7;
    [zoom>=15] { line-width: 7 + 1 }
    [zoom>=16] { line-width: 7 + 2 }
    line-color: #333;
    line-opacity: 0.5;
  }
  ::outline { 
    line-cap: round;
    line-width: 5;
    [zoom>=15] { line-width: 5 + 1 }
    [zoom>=16] { line-width: 5 + 2 }
  	line-color: rgb(200,200,200);
  	[tunnel!=''] { line-dasharray: 4,4 }
  }
}

#line::sub11 [zoom>12][railway='subway']{
  line-width: 3;
  line-color: rgb(100,100,100);
  [tunnel!=''] { opacity: 0.5 }
}
#line::sub12 [zoom>12][railway='rail'],
#line::sub12 [zoom>12][railway='preserved'],
#line::sub12 [zoom>12][railway='monorail'],
#line::sub12 [zoom>12][railway='narrow_gauge']{
  ::outline {
    line-width: 3;
  	line-color: rgb(100,100,100);
  }
  ::fill {
    line-width: 1.5;
	line-color: rgb(200,200,200);
    line-dasharray: 3,3;
  
    [railway='rail'],[railway='narrow_gauge'] {
      line-color: rgb(255,255,255)
	}
	[railway='monorail']{
  	  line-dasharray: 1,2,4,2;
    }
	[railway='preserved']{
	}
  }
}


#line::sub13 [zoom>12][highway='secondary'],
#line::sub13 [zoom>12][highway='secondary_link'],
#line::sub13 [zoom>12][highway='primary'],
#line::sub13 [zoom>12][highway='primary_link']{
  ::bridge [bridge!=''] {
    line-width: 8;
    [zoom>=15] { line-width: 8 + 1 }
    [zoom>=16] { line-width: 8 + 2 }
    line-color: #333;
    line-opacity: 0.5;
  }
  ::outline { 
    line-cap: round;
    line-width: 6;
    [zoom>=15] { line-width: 6 + 1 }
    [zoom>=16] { line-width: 6 + 2 }
    line-color: rgb(171,158,137);
    [tunnel!=''] { line-dasharray: 4,4 }
  }
}
#line::sub14 [zoom>12][highway='motorway'],
#line::sub14 [zoom>12][highway='motorway_link'],
#line::sub14 [zoom>12][highway='trunk'],
#line::sub14 [zoom>12][highway='trunk_link']{
  ::bridge [bridge!=''] {
    line-width: 9;
    [zoom>=15] { line-width: 9 + 1 }
    [zoom>=16] { line-width: 9 + 2 }
    line-color: #333;
    line-opacity: 0.5;
  }
  ::outline { 
    line-cap: round;
    line-width: 7;
    [zoom>=15] { line-width: 7 + 1 }
    [zoom>=16] { line-width: 7 + 2 }
    line-color: rgb(188,149,28);
    [tunnel!=''] { line-dasharray: 4,4 }
  }
}
#line::sub15 [zoom>12][aeroway='runway']{
  line-width: 10;
  line-cap: round;
  line-color: rgb(100,130,100)
}
#line::sub16 [zoom>12][aeroway='taxiway']{
  line-width: 4.5;
  line-cap: round;
  line-color: rgb(100,130,100)
}
#line::sub17 [zoom>12][railway='subway']{
  line-dasharray: 3,3;
  line-width: 1.5;
  line-color: rgb(255,255,255);
  [tunnel!=''] { line-opacity: 0.5 }
}

#line::sub21 [zoom>12][highway='secondary'],
#line::sub21 [zoom>12][highway='secondary_link']{
  line-width: 4.5;
  line-cap: round;
  [zoom>=15] { line-width: 4.5 + 1 }
  [zoom>=16] { line-width: 4.5 + 2 }
  line-color: rgb(255,250,115);
  [tunnel!=''] { line-opacity: 0.75 }
}
#line::sub22 [zoom>12][highway='primary'],
#line::sub22 [zoom>12][highway='primary_link']{
  line-width: 4;
  line-cap: round;
  [zoom>=15] { line-width: 4 + 1 }
  [zoom>=16] { line-width: 4 + 2 }
  line-color: rgb(255,230,95);
  [tunnel!=''] { line-opacity: 0.75 }
}
#line::sub23 [zoom>12][highway='motorway'],
#line::sub23 [zoom>12][highway='motorway_link'],
#line::sub23 [zoom>12][highway='trunk'],
#line::sub23 [zoom>12][highway='trunk_link']{
  line-width: 5;
  line-cap: round;
  [zoom>=15] { line-width: 5 + 1 }
  [zoom>=16] { line-width: 5 + 2 }
  line-color: rgb(242,191,36);
  [tunnel!=''] { line-opacity: 0.75 }
}

#line::sub24 [zoom>12][aeroway='runway']{
  line-width: 8;
  line-cap: round;
  line-color: rgb(150,180,150)
}
#line::sub25 [zoom>12][aeroway='taxiway']{
  line-width: 2.5;
  line-cap: round;
  line-color: rgb(150,180,150)
}

#line::sub26 [zoom>12][railway='tram']{
  line-dasharray: 3,3;
  line-width: 1.5;
  line-color: rgb(0,0,0)
}
#line::sub28 [zoom>12][access='private'],
#line::sub28 [zoom>12][access='residents'],
#line::sub28 [zoom>12][access='permissive']{
  line-dasharray: 1.5,3;
  line-width: 1.5;
  line-cap: round;
  [access='private'] { line-color: rgb(200,100,100) }
  [access='residents'] { line-color: rgb(100,100,200) }
  [access='permissive'] { line-color: rgb(100,200,100) }
}
/*#line::sub29 [zoom>12][building:part!='']{
  line-width: 1;
  line-color: rgb(127,127,255)
}*/
