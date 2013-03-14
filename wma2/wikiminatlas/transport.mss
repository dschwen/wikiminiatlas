// Constants
@bridgewidth: 3;
@add15: 1;
@add16: 2;
@add17: 3;

// Outlines
#transport::outlines [zoom>12],
#tunnels::outlines   [zoom>12],
#bridges::outlines   [zoom>12] { 

  [highway='residential'],
  [highway='unclassified'] {
    ::bridge [bridge!=''] {
      line-width: 4 + @bridgewidth;
      line-smooth: 1;
      [zoom=13] { line-width: 4 + @bridgewidth - 1 }
      [zoom>=15] { line-width: 4 + @bridgewidth + 1 }
      [zoom>=16] { line-width: 4 + @bridgewidth + 2 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline [zoom>13] { 
      line-width: 4;
      line-smooth: 1;
      line-cap: round;
      [zoom>=15] { line-width: 4 + 1 }
      [zoom>=16] { line-width: 4 + 2 }
      line-color: rgb(200,200,200);
    }
  }
  
  [highway='tertiary']{
    ::bridge [bridge!=''] {
      line-width: 5 + @bridgewidth;
      line-smooth: 1;
      [zoom>=15] { line-width: 5 + @bridgewidth + 1 }
      [zoom>=16] { line-width: 5 + @bridgewidth + 2 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline { 
      line-width: 5;
      line-smooth: 1;
      line-cap: round;
      [zoom>=15] { line-width: 5 + 1 }
      [zoom>=16] { line-width: 5 + 2 }
      line-color: rgb(200,200,200);
      [tunnel!=''] { 
        line-dasharray: 4,4;
        line-cap: butt;
      }
      [bridge!=''] { line-cap: butt; }
    }
  }

  [highway='secondary'],[highway='secondary'],
  [highway='secondary_link'],[highway='primary'],
  [highway='primary_link']{
    ::bridge [bridge!=''] {
      line-width: 6 + @bridgewidth;
      line-smooth: 1;
      [zoom>=15] { line-width: 6 + @bridgewidth + 1 }
      [zoom>=16] { line-width: 6 + @bridgewidth + 2 }
      [zoom>=17] { line-width: 6 + @bridgewidth + 3 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline  { 
      line-width: 6;
      line-smooth: 1;
      line-cap: round;
      [zoom>=15] { line-width: 6 + 1 }
      [zoom>=16] { line-width: 6 + 2 }
      [zoom>=17] { line-width: 6 + 3 }
      line-color: rgb(171,158,137);
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
    ::bridge [bridge!=''] {
      line-width: 7 + @bridgewidth;
      line-smooth: 1;
      [zoom>=15] { line-width: 7 + @bridgewidth + 1 }
      [zoom>=16] { line-width: 7 + @bridgewidth + 2 }
      [zoom>=17] { line-width: 7 + @bridgewidth + 3 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline { 
      line-width: 7;
      line-smooth: 1;
	  line-cap: round;
      [zoom>=15] { line-width: 7 + 1 }
      [zoom>=16] { line-width: 7 + 2 }
      [zoom>=17] { line-width: 7 + 3 }
      line-color: rgb(188,149,28);
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
  [highway='residential'],
  [highway='unclassified'] {
    line-width: 3;
    line-cap: round;
    line-smooth: 1;
    [zoom=13] { line-width: 3 - 0.5; line-opacity: 0.75; }
    [zoom>=15] { line-width: 3 + 1 }
    [zoom>=16] { line-width: 3 + 2 }
    line-color: #ffffff;
  }
  [highway='tertiary'] {
    line-width: 4;
    line-cap: round;
    line-smooth: 1;
    [zoom>=15] { line-width: 4 + 1 }
    [zoom>=16] { line-width: 4 + 2 }
    [zoom>=17] { line-width: 4 + 3 }
    line-color: rgb(255,255,170);
  }
  [highway='secondary'],[highway='secondary_link'] {
    line-width: 4.5;
    line-cap: round;
    line-smooth: 1;
    [zoom>=15] { line-width: 4.5 + 1 }
    [zoom>=16] { line-width: 4.5 + 2 }
    [zoom>=17] { line-width: 4.5 + 3 }
    line-color: rgb(255,250,115);
  }
  [highway='primary'],[highway='primary_link'] {
    line-width: 4;
    line-cap: round;
    line-smooth: 1;
    [zoom>=15] { line-width: 4 + 1 }
    [zoom>=16] { line-width: 4 + 2 }
    [zoom>=17] { line-width: 4 + 3 }
    line-color: rgb(255,230,95);
  }
  [highway='motorway'],[highway='motorway_link'],
  [highway='trunk'],[highway='trunk_link'] {
    line-width: 5;
    line-cap: round;
    line-smooth: 1;
    [zoom>=15] { line-width: 5 + 1 }
    [zoom>=16] { line-width: 5 + 2 }
    [zoom>=17] { line-width: 5 + 3 }
    line-color: rgb(242,191,36);
  }

  [tunnel!=''] { 
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
    line-cap: round;
    [zoom=13] { line-opacity: 0.5 }
    [access='private'] { line-color: rgb(200,100,100) }
    [access='residents'] { line-color: rgb(100,100,200) }
    [access='permissive'] { line-color: rgb(100,200,100) }
  }
}
