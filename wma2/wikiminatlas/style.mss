@ocean: rgb(158,199,243);
Map {
  background-color: @ocean;
}

/*#countries [zoom<=5]{
  ::outline {
    line-color: #85c5d3;
    line-width: 2;
    line-join: round;
  }
  polygon-fill: #fff;
}*/

#hirescoast [zoom>=10]{
  polygon-fill: rgb(250,250,208);
  polygon-gamma: 0.75;
}
#lorescoast [zoom<10]{
  polygon-fill: rgb(250,250,208);
  polygon-gamma: 0.75;
}


#bathymetry {
  //polygon-fill: rgb(16,12,4);
  polygon-fill: rgb(8,8,8);
  polygon-comp-op: minus;
}

@grass: rgb(208, 250, 208);
@trees: rgb(190, 240, 190);
@swamp: rgb(204, 224, 225);

#trees [zoom<12],
#polygon [zoom>=12][natural='wood'] {
  polygon-opacity:1;
  polygon-fill: @trees;
}

#water [zoom<12] {
  polygon-opacity:1;
  polygon-fill: @ocean;
  polygon-gamma: 0.75;
}

#grass [zoom<12],
#polygon [zoom>=12][natural='fell'],
#polygon [zoom>=12][natural='grassland'] {
  polygon-opacity:1;
  polygon-fill: @grass;
}

#swamp [zoom<12],
#polygon [zoom>=12][natural='wetland'] {
  polygon-opacity:1;
  polygon-fill: @swamp;
}

@border: rgb(108,108,108);
#borders [ADMIN_LEVE='4']{
  line-color: @border;
  line-width: 0.5;
}
#borders [ADMIN_LEVE='3'][zoom>=4]{
  line-color: @border;
  line-width: 0.15;
}