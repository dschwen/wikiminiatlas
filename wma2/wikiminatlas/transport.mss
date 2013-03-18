// Constants
@bridgewidth: 2;
@add15: 1;
@add16: 2;
@add17: 3;
@smooth: 0.75;

// Colors
@color_motorway:    rgb(242,191,36);
@color_primary:     rgb(255,230,95);
@color_secondary:   rgb(255,250,115);
@color_tertiary:    rgb(255,255,170);
@color_residential: #ffffff;
@outlinedarken: 0.5;

// Outlines
#transport::outlines [zoom>12],
#tunnels::outlines   [zoom>12],
#bridges::outlines   [zoom>12] { 
  [railway='subway'],[railway='rail'], [railway='preserved'],
  [railway='monorail'],[railway='narrow_gauge'] {
    ::bridge [bridge!=''][zoom>=15] {
      line-width: 3 + @bridgewidth;
      line-smooth: @smooth;
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline {
      line-width: 3;
      line-color: rgb(150,150,150);
      [railway='subway'] { line-color: rgb(175,175,175) }
      line-smooth: @smooth;
      [tunnel!=''] { opacity: 0.5 }
      [bridge!=''] { line-cap: butt; }
    }
  }

  [highway='pedestrian']{
    ::bridge [bridge!=''][zoom>=16] {
      line-width: 5 + @bridgewidth;
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline [zoom>=16] { 
      line-width: 5;
      line-color: rgb(255,255,255)
    }
  }

  [bridge!=''][zoom>=16] {
    [highway='footway'],[highway='path']{
      line-width: 2 + @bridgewidth;
      line-color: #333;
      line-opacity: 0.5;
    }
  }
  
  [highway='residential'],
  [highway='unclassified'] {
    ::bridge [bridge!=''][zoom>=15] {
      line-width: 4 + @bridgewidth;
      line-smooth: @smooth;
      [zoom=13] { line-width: 4 + @bridgewidth - 1 }
      [zoom>=15] { line-width: 4 + @bridgewidth + 1 }
      [zoom>=16] { line-width: 4 + @bridgewidth + 2 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline [zoom>13] { 
      line-width: 4;
      line-smooth: @smooth;
      line-cap: round;
      [zoom>=15] { line-width: 4 + 1 }
      [zoom>=16] { line-width: 4 + 2 }
      line-color: @color_residential * @outlinedarken;
      [tunnel!=''] { 
        line-dasharray: 4,4;
        line-cap: butt;
      }
      [bridge!=''] { line-cap: butt; }
    }
  }
  
  [highway='tertiary']{
    ::bridge [bridge!=''][zoom>=15] {
      line-width: 5 + @bridgewidth;
      line-smooth: @smooth;
      [zoom>=15] { line-width: 5 + @bridgewidth + 1 }
      [zoom>=16] { line-width: 5 + @bridgewidth + 2 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline { 
      line-width: 5;
      line-smooth: @smooth;
      line-cap: round;
      [zoom>=15] { line-width: 5 + 1 }
      [zoom>=16] { line-width: 5 + 2 }
      line-color: @color_tertiary * @outlinedarken;
      [tunnel!=''] { 
        line-dasharray: 4,4;
        line-cap: butt;
      }
      [bridge!=''] { line-cap: butt; }
    }
  }

  [highway='secondary'],[highway='secondary_link'],
  [highway='primary'],[highway='primary_link']{
    ::bridge [bridge!=''][zoom>=15] {
      line-width: 6 + @bridgewidth;
      line-smooth: @smooth;
      [zoom>=15] { line-width: 6 + @bridgewidth + 1 }
      [zoom>=16] { line-width: 6 + @bridgewidth + 2 }
      [zoom>=17] { line-width: 6 + @bridgewidth + 3 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline  { 
      line-width: 6;
      line-smooth: @smooth;
      line-cap: round;
      [zoom>=15] { line-width: 6 + 1 }
      [zoom>=16] { line-width: 6 + 2 }
      [zoom>=17] { line-width: 6 + 3 }
      line-color: @color_secondary * @outlinedarken;
      [highway='primary'],[highway='primary_link']{
        line-color: @color_primary * @outlinedarken;
      }
      [tunnel!=''] { 
        line-dasharray: 4,4;
        line-cap: butt;
        line-width: 0
      }
      [bridge!=''] { line-cap: butt; }
  	}
  }
  
  [highway='motorway'],[highway='motorway_link'],
  [highway='trunk'],[highway='trunk_link'] {
    ::bridge [bridge!=''][zoom>=15] {
      line-width: 7 + @bridgewidth;
      line-smooth: @smooth;
      [zoom>=15] { line-width: 7 + @bridgewidth + 1 }
      [zoom>=16] { line-width: 7 + @bridgewidth + 2 }
      [zoom>=17] { line-width: 7 + @bridgewidth + 3 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline { 
      line-width: 7;
      line-smooth: @smooth;
	  line-cap: round;
      [zoom>=15] { line-width: 7 + 1 }
      [zoom>=16] { line-width: 7 + 2 }
      [zoom>=17] { line-width: 7 + 3 }
      line-color: @color_motorway * @outlinedarken;
      [tunnel!=''] { 
        line-dasharray: 4,4;
        line-cap: butt;
        line-width: 0;
      }
      [bridge!=''] { line-cap: butt; }
    }
  }
  
}
  
// Inlines
#transport::inlines [zoom>12],
#tunnels::inlines   [zoom>12],
#bridges::inlines   [zoom>12] {
  // needed to avoid artifacts on undefined ways
  [tunnel!=''] { line-width: 0 }
  
  [railway='rail'], [railway='preserved'],[railway='subway'],
  [railway='monorail'],[railway='narrow_gauge'] {
    line-width: 1.5;
	line-color: rgb(200,200,200);
    line-dasharray: 3,3;
  
    [railway='subway'][railway='rail'],
    [railway='narrow_gauge'] {
      line-color: rgb(255,255,255)
	}
	[railway='monorail']{
  	  line-dasharray: 1,2,4,2;
    }
	[railway='preserved']{
	}
    [tunnel!=''] { line-opacity: 0.5 }
  }

  [zoom>=16][highway='footway'],
  [zoom>=16][highway='pedestrian'],
  [zoom>=16][highway='path']{
    line-width: 2;
    line-color: rgb(198,178,178);
    [tunnel!=''] { line-dasharray: 4,4 }
  }
  
  
  [highway='residential'],
  [highway='unclassified'] {
    line-width: 3;
    line-cap: round;
    line-smooth: @smooth;
    [zoom=13] { line-width: 3 - 0.5; line-opacity: 0.75; }
    [zoom>=15] { line-width: 3 + 1 }
    [zoom>=16] { line-width: 3 + 2 }
    line-color: @color_residential;
  }
  [highway='tertiary'] {
    line-width: 4;
    line-cap: round;
    line-smooth: @smooth;
    [zoom>=15] { line-width: 4 + 1 }
    [zoom>=16] { line-width: 4 + 2 }
    [zoom>=17] { line-width: 4 + 3 }
    line-color: @color_tertiary;
  }
  [highway='secondary'],[highway='secondary_link'] {
    line-width: 4.5;
    line-cap: round;
    line-smooth: @smooth;
    [zoom>=15] { line-width: 4.5 + 1 }
    [zoom>=16] { line-width: 4.5 + 2 }
    [zoom>=17] { line-width: 4.5 + 3 }
    line-color: @color_secondary;
  }
  [highway='primary'],[highway='primary_link'] {
    line-width: 4;
    line-cap: round;
    line-smooth: @smooth;
    [zoom>=15] { line-width: 4 + 1 }
    [zoom>=16] { line-width: 4 + 2 }
    [zoom>=17] { line-width: 4 + 3 }
    line-color: @color_primary;
  }
  [highway='motorway'],[highway='motorway_link'],
  [highway='trunk'],[highway='trunk_link'] {
    line-width: 5;
    line-cap: round;
    line-smooth: @smooth;
    [zoom>=15] { line-width: 5 + 1 }
    [zoom>=16] { line-width: 5 + 2 }
    [zoom>=17] { line-width: 5 + 3 }
    line-color: @color_motorway;
  }

  [tunnel!=''][highway!=''] { 
    line-dasharray: 4,4;
    line-cap: butt;
  }
}

// Access
#transport::access [zoom>12],
#tunnels::access   [zoom>12],
#bridges::access   [zoom>12] { 
  [access='private'],
  [access='residents'],
  [access='permissive']{
    line-dasharray: 1.5,3;
    line-width: 1.5;
    line-smooth: @smooth;
    line-cap: round;
    [zoom=13] { line-opacity: 0.5 }
    [access='private'] { line-color: rgb(200,100,100) }
    [access='residents'] { line-color: rgb(100,100,200) }
    [access='permissive'] { line-color: rgb(100,200,100) }
  }
}

#transport::tram [zoom>12][railway='tram']{
  line-dasharray: 3,3;
  line-width: 1.5;
  [zoom<16] { line-width: 1; }
  line-color: rgb(0,0,0);
  line-opacity: 0.4;
}

#turningcircle [zoom>13] {
  marker-width:10;
  marker-fill: @color_residential;
  marker-line-color: @color_residential * @outlinedarken;
  marker-line-width: 0.5;
  marker-allow-overlap:true;
}

#bigroads [zoom>=6][zoom<12] {  
  [highway='motorway'],[highway='motorway_link'],
  [highway='trunk'],[highway='trunk_link'] {
    ::outline { 
      line-width: 2;
	  line-smooth: @smooth;
      line-color: @color_motorway * @outlinedarken;
    }
    ::inline { 
      line-width: 1;
	  line-smooth: @smooth;
      line-color: @color_motorway;
    }
  }
  [highway='secondary'][zoom>=9],
  [highway='secondary_link'][zoom>=9], {
    ::outline { 
      line-width: 2;
	  line-smooth: @smooth;
      line-color: @color_secondary * @outlinedarken;
    }
    ::inline { 
      line-width: 1;
	  line-smooth: @smooth;
      line-color: @color_secondary;
    }
  }
}