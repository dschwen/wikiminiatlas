@font_reg: "Ubuntu Regular","Arial Regular","DejaVu Sans Book";
@size10: 12;
@size11: 12;
@size12: 13;

/* ---- HIGHWAY ---- */
@label_darken: 30;
@label_darken2: 10;

#biglabels [zoom>=13] {
  text-face-name:@font_reg;
  text-halo-radius:1;
  text-placement:line;
  text-name:"''";
  text-size:@size10;
  [highway='motorway'][zoom>=13] {
    text-name:"[name]";
    text-fill:spin(darken(@color_motorway,@label_darken2),-15);
    text-halo-fill:lighten(@color_motorway,15);
    [zoom>=13] { text-size:@size11; }
    [zoom>=15] { text-size:@size12; }
  }
  [highway='trunk'][zoom>=13] {
    text-name:"[name]";
    text-fill:spin(darken(@color_motorway,@label_darken2),-15);
    text-halo-fill:lighten(@color_motorway,15);
    [zoom>=15] { text-size:@size11; }
  }
  [highway='primary'][zoom>=15] {
    text-name:"[name]";
    text-fill:spin(darken(@color_primary,@label_darken),-15);
    text-halo-fill:lighten(@color_primary,15);
    [zoom>=15] { text-size:@size11; }
  }
  [highway='secondary'][zoom>=15] {
    text-name:"[name]";
    text-fill:spin(darken(@color_secondary,@label_darken),-15);
    text-halo-fill:lighten(@color_secondary,15);
    [zoom>=15] { text-size:@size11; }
  }
}

#smalllabels [zoom>=16] {
  text-face-name:@font_reg;
  text-halo-radius:1;
  text-placement:line;
  text-name:"''";
  text-size:@size10;
  [highway='residential'], [highway='road'],
  [highway='tertiary'], [highway='unclassified'] {
    text-name:"[name]";
    text-fill: spin(darken(@color_residential,@label_darken),-15);
    text-halo-fill: lighten(@color_residential,15);
  }
}

/* ---- LOCATION ---- */

/*
#places[type='city'][zoom>6][zoom<14] {
  text-face-name:@font_reg;
  text-name:"[name]";
  text-fill:#444;
  text-halo-fill:rgba(255,255,255,0.8);
  text-halo-radius:2;
  text-transform:uppercase;
  [zoom=11] {
    text-size:12;
    text-character-spacing:2;
  }
  [zoom=12] {
    text-size:14;
    text-character-spacing:4;
  }
  [zoom=13] {
    text-size:16;
    text-character-spacing:8;
  }
}

#places[type='town'][zoom>6][zoom<15] {
  text-face-name:@font_reg;
  text-name:"[name]";
  text-fill:#444;
  text-halo-fill:rgba(255,255,255,0.8);
  text-halo-radius:2;
  text-transform:uppercase;
  text-size:9;
  [zoom=11] {
    text-size:10;
    text-character-spacing:1;
  }
  [zoom=12] {
    text-size:11;
    text-character-spacing:2;
  }
  [zoom=13] {
    text-size:12;
    text-character-spacing:3;
  }
  [zoom=14] {
    text-size:14;
    text-character-spacing:4;
  }
}

#places[type='hamlet'][zoom>13][zoom<18],
#places[type='suburb'][zoom>13][zoom<18],
#places[type='neighbourhood'][zoom>14][zoom<18] {
  text-face-name:@font_reg;
  text-name:"[name]";
  text-fill:#555;
  text-halo-fill:rgba(255,255,255,0.8);
  text-halo-radius:2;
  text-wrap-width:100;
  text-wrap-before:true;
  [zoom=15] {
    text-size:11;
    text-character-spacing:1;
    text-wrap-width:50;
    text-line-spacing:1;
  }
  [zoom=16] {
    text-size:13;
    text-character-spacing:2;
    text-wrap-width:80;
    text-line-spacing:2;
  }
  [zoom=17] {
    text-size:15;
    text-character-spacing:4;
    text-wrap-width:100;
    text-line-spacing:4;
  }
}
*/