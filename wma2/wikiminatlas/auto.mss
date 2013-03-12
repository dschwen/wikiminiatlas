
#polygon::sub1 [zoom>12][railway='platform']{
  polygon-fill: rgb(220,220,220)
}
#polygon::sub2 [zoom>12][landuse='industrial'][landuse='retail'][landuse='commercial'][landuse='residential']{
  polygon-fill: rgb(208,208,208)
}
#polygon::sub3 [zoom>12][landuse='reservoir']{
  polygon-fill: rgb(200,200,224)
}
#polygon::sub4 [zoom>12][landuse='military'][landuse='railway']{
  polygon-fill: rgb(224,200,200)
}
#polygon::sub5 [zoom>12][landuse='cemetery'][landuse='recreation_ground']{
  polygon-fill: rgb(190,214,190)
}
#polygon::sub6 [zoom>12][landuse='grass']{
  polygon-fill: rgb(0,160,0)
}
#polygon::sub7 [zoom>12][leisure='park'][leisure='orchard'][leisure='meadow'][leisure='village_green'][leisure='golf_course'][leisure='track'][leisure='forrest'][leisure='recreation_ground'][leisure='dog_park'][leisure='garden'][leisure='pitch'][leisure='stadium']{
  polygon-fill: rgb(200,224,200)
}
#polygon::sub8 [zoom>12][waterway='riverbank'][waterway='dock']{
  polygon-fill: rgb(158,199,243)
}
#polygon::sub9 [zoom>12][natural='beach'][natural='sand']{
  polygon-fill: rgb(250,242,175)
}
#polygon::sub10 [zoom>12][natural='wetland'][natural='mud']{
  polygon-fill: rgb(200,218,224)
}
#polygon::sub11 [zoom>12][natural='grassland'][natural='fell']{
  polygon-fill: rgb(200,224,200)
}
#polygon::sub12 [zoom>12][natural='scrub']{
  polygon-fill: rgb(150,214,150)
}
#polygon::sub13 [zoom>12][natural='wood']{
  polygon-fill: rgb(100,204,100)
}
#polygon::sub14 [zoom>12][natural='water'][natural='bay']{
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
/*#polygon::sub18 [zoom>12][highway='pedestrian']{
  polygon-fill: rgb(255,255,255)
}*/
#polygon::sub19 [zoom>12][tourism!='']{
  line-dasharray: 3,3;
  line-width: 2;
  line-color: rgb(255,255,0)
}
#polygon::sub20 [zoom>12][aeroway='terminal']{
  polygon-fill: rgb(190,210,190)
}
#polygon::sub21 [zoom>12][historic='memorial'][historic='monument'][historic='fort'][historic='castle']{
  polygon-fill: rgb(255,190,190)
}
#polygon::sub22 [zoom>12][historic='ship'][historic='wreck']{
  polygon-fill: rgb(255,190,235)
}
#polygon::sub23 [zoom>12][railway='station']{
  polygon-fill: rgb(210,195,195)
}
#polygon::sub24 [zoom>12][natural='water'][natural='bay']{
  polygon-fill: rgb(158,199,243)
}
#polygon::sub25 [zoom>12][building!='']{
  polygon-fill: rgb(200,200,200)
}
/*#polygon::sub26 [zoom>12]['building:part'!='']{
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
/*#line::sub4 [zoom>12][highway='pedestrian']{
  line-width: 5;
  line-color: rgb(255,255,255)
}
#line::sub5 [zoom>12][highway='footway'][highway='pedestrian'][highway='path']{
  line-width: 2;
  line-color: rgb(198,178,178)
}
#line::sub6 [zoom>12][highway='steps']{
  line-dasharray: 1.5,1.5;
  line-width: 3;
  line-color: rgb(168,148,148)
}
#line::sub7 [zoom>12][highway='service']{
  line-width: 4;
  line-color: rgb(168,168,168)
}
#line::sub8 [zoom>12][highway='track']{
  line-width: 3.5;
  line-color: rgb(168,168,168)
}
#line::sub9 [zoom>12][highway='residential'][highway='unclassified']{
  line-width: 4;
  line-color: rgb(200,200,200)
}
#line::sub10 [zoom>12][highway='tertiary']{
  line-width: 5;
  line-color: rgb(200,200,200)
}*/
#line::sub11 [zoom>12][railway='subway']{
  line-width: 3;
  line-color: rgb(100,100,100);
  line-opacity: 0.5;
}
#line::sub12 [zoom>12][railway='rail'][railway='preserved'][railway='monorail'][railway='narrow_gauge']{
  line-width: 3;
  line-color: rgb(100,100,100)
}
/*#line::sub13 [zoom>12][highway='secondary'][highway='secondary_link'][highway='primary'][highway='primary_link']{
  line-width: 6;
  line-color: rgb(171,158,137)
}
#line::sub14 [zoom>12][highway='motorway'][highway='motorway_link'][highway='trunk'][highway='trunk_link']{
  line-width: 7;
  line-color: rgb(188,149,28)
}*/
#line::sub15 [zoom>12][aeroway='runway']{
  line-cap: round;
  line-width: 10;
  line-color: rgb(100,130,100)
}
#line::sub16 [zoom>12][aeroway='taxiway']{
  line-width: 4.5;
  line-color: rgb(100,130,100);
  line-cap: round;
}
#line::sub17 [zoom>12][railway='subway']{
  line-dasharray: 3,3;
  line-width: 1.5;
  line-color: rgb(255,255,255)
}
#line::sub18 [zoom>12][railway='rail'][railway='narrow_gauge']{
  line-dasharray: 3,3;
  line-width: 1.5;
  line-color: rgb(255,255,255)
}
#line::sub19 [zoom>12][railway='preserved']{
  line-dasharray: 3,3;
  line-width: 1.5;
  line-color: rgb(200,200,200)
}
#line::sub20 [zoom>12][railway='monorail']{
  line-dasharray: 1,2,4,2;
  line-width: 1.5;
  line-color: rgb(200,200,200)
}
#line::sub21 [zoom>12][highway='secondary'][highway='secondary_link']{
  line-width: 4.5;
  line-color: rgb(255,250,115)
}
#line::sub22 [zoom>12][highway='primary'][highway='primary_link']{
  line-width: 4;
  line-color: rgb(255,230,95)
}
#line::sub23 [zoom>12][highway='motorway'][highway='motorway_link'][highway='trunk'][highway='trunk_link']{
  line-width: 5;
  line-color: rgb(242,191,36)
}
#line::sub24 [zoom>12][aeroway='runway']{
  line-cap: round;
  line-width: 8;
  line-color: rgb(150,180,150)
}
#line::sub25 [zoom>12][aeroway='taxiway']{
  line-cap: round;
  line-width: 2.5;
  line-color: rgb(150,180,150)
}
#line::sub26 [zoom>12][railway='tram']{
  line-dasharray: 3,3;
  line-width: 1.5;
  line-color: rgb(0,0,0)
}
#line::sub27 [zoom>12][access='permissive']{
  line-dasharray: 1,2;
  line-width: 1;
  line-color: rgb(100,200,100)
}
#line::sub28 [zoom>12][access='private'][access='residents']{
  line-dasharray: 1,2;
  line-width: 1;
  line-color: rgb(200,100,100)
}
/*#line::sub29 [zoom>12]['building:part'!='']{
  line-width: 1;
  line-color: rgb(127,127,255)
}*/
