// Outlines
#transport [zoom>12],
#tunnels   [zoom>12],
#bridges   [zoom>12] { 

  [highway='tertiary']{
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

  [highway='secondary'],[highway='secondary'],
  [highway='secondary_link'],[highway='primary'],
  [highway='primary_link']{
    ::bridge [bridge!=''] {
      line-width: 8;
      [zoom>=15] { line-width: 8 + 1 }
      [zoom>=16] { line-width: 8 + 2 }
      [zoom>=17] { line-width: 8 + 3 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline { 
      line-width: 6;
      [zoom>=15] { line-width: 6 + 1 }
      [zoom>=16] { line-width: 6 + 2 }
      [zoom>=17] { line-width: 6 + 3 }
      line-color: rgb(171,158,137);
      [tunnel!=''] { line-dasharray: 4,4 }
  	}
  }
  
  [highway='motorway'],[highway='motorway_link'],
  [highway='trunk'],[highway='trunk_link'] {
    ::bridge [bridge!=''] {
      line-width: 9;
      line-smooth: 1;
      [zoom>=15] { line-width: 9 + 1 }
      [zoom>=16] { line-width: 9 + 2 }
      [zoom>=17] { line-width: 9 + 3 }
      line-color: #333;
      line-opacity: 0.5;
    }
    ::outline { 
      line-width: 7;
      line-smooth: 1;
      [zoom>=15] { line-width: 7 + 1 }
      [zoom>=16] { line-width: 7 + 2 }
      [zoom>=17] { line-width: 7 + 3 }
      line-color: rgb(188,149,28);
      [tunnel!=''] { line-dasharray: 4,4 }
    }
  }
  
}
  
// Inlines
#transport [zoom>12],
#tunnels   [zoom>12],
#bridges   [zoom>12] { 
  [highway='tertiary'] {
    line-width: 4;
    line-cap: round;
    [zoom>=15] { line-width: 4 + 1 }
    [zoom>=16] { line-width: 4 + 2 }
    [zoom>=17] { line-width: 4 + 3 }
    line-color: rgb(255,255,170);
    [tunnel!=''] { line-dasharray: 4,4 }
  }
  [highway='secondary'],[highway='secondary_link'] {
    line-width: 4.5;
    line-cap: round;
    [zoom>=15] { line-width: 4.5 + 1 }
    [zoom>=16] { line-width: 4.5 + 2 }
    [zoom>=17] { line-width: 4.5 + 3 }
    line-color: rgb(255,250,115);
    [tunnel!=''] { line-dasharray: 4,4 }
  }
  [highway='primary'],[highway='primary_link'] {
    line-width: 4;
    line-cap: round;
    [zoom>=15] { line-width: 4 + 1 }
    [zoom>=16] { line-width: 4 + 2 }
    [zoom>=17] { line-width: 4 + 3 }
    line-color: rgb(255,230,95);
    [tunnel!=''] { line-dasharray: 4,4 }
  }
  [zoom>12][highway='motorway'],[highway='motorway_link'],
  [highway='trunk'],[highway='trunk_link'] {
    line-width: 5;
    line-cap: round;
    line-smooth: 1;
    [zoom>=15] { line-width: 5 + 1 }
    [zoom>=16] { line-width: 5 + 2 }
    [zoom>=17] { line-width: 5 + 3 }
    line-color: rgb(242,191,36);
    [tunnel!=''] { line-dasharray: 4,4 }
  }
}