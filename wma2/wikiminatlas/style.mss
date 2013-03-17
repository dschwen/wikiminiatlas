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

#hirescoast{
  polygon-fill: rgb(250,250,208);
  polygon-gamma: 0.75;
}

/*
#bridges {
  line-color: #f00;
  line-width: 1;
}*/
#bathymetry {
  //polygon-fill: rgb(16,12,4);
  polygon-fill: rgb(8,8,8);
  polygon-comp-op: minus;
}
/*#bathy200 {
  polygon-gamma: 0.75;
  polygon-fill: @ocean*0.975;
}
#bathy1000 {
  polygon-gamma: 0.75;
  polygon-fill: @ocean*0.95;
}
#bathy2000 {
  polygon-gamma: 0.75;
  polygon-fill: @ocean*0.925;
}
#bathy3000 {
  polygon-gamma: 0.75;
  polygon-fill: @ocean*0.9;
}
#bathy4000 {
  polygon-gamma: 0.75;
  polygon-fill: @ocean*0.875;
}*/
