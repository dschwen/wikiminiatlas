var util=require('util'),
    stdin=process.stdin;

var starcol = {
  O5: [157,180,255],
  B1: [162,185,255],
  B3: [167,188,255],
  B5: [170,191,255],
  B8: [175,195,255],
  A1: [186,204,255],
  A3: [192,209,255],
  A5: [202,216,255],
  F0: [228,232,255],
  F2: [237,238,255],
  F5: [251,248,255],
  F8: [255,249,249],
  G2: [255,245,236],
  G5: [255,244,232],
  G8: [255,241,223],
  K0: [255,235,209],
  K4: [255,215,174],
  K7: [255,198,144],
  M2: [255,190,127],
  M4: [255,187,123],
  M6: [255,187,123]
};

// bcs format
function parseStar(line) {
  var i, s = {},
      format = [
        [76,77,'RAh'],      //  Hours RA, equinox J2000, epoch 2000.0 (1)
        [78,79,'RAm'],      //  Minutes RA, equinox J2000, epoch 2000.0 (1)
        [80,83,'RAs'],      //  Seconds RA, equinox J2000, epoch 2000.0 (1)
        [84,84,'DEx'],      //  Sign Dec, equinox J2000, epoch 2000.0 (1)
        [85,86,'DEd'],      //  Degrees Dec, equinox J2000, epoch 2000.0 (1)
        [87,88,'DEm'],      //  Minutes Dec, equinox J2000, epoch 2000.0 (1)
        [89,90,'DEs'],      //  Seconds Dec, equinox J2000, epoch 2000.0 (1)
        [91,96,'GLON'],     //  Galactic longitude (1)
        [97,102,'GLAT'],    //  Galactic latitude (1)
        [103,107,'Vmag'],   //  Visual magnitude (1)
        [108,108,'n_Vmag'], //  Visual magnitude code
        [110,114,'BmV'],    //  B-V color in the UBV system
        [116,120,'UmB'],    //  U-B color in the UBV system
        [122,126,'RmI'],    //  R-I   in system specified by n_R-I
        [127,127,'nRI'],    //  Code for R-I system (Cousin, Eggen)
        [128,147,'SpType'], //  Spectral type
        [130,131,'Spec2']   //  2 letter Spectral type
      ];
  for( i=0; i<format.length; ++i ) {
    s[format[i][2]] = line.substr( format[i][0]-1, format[i][1]-format[i][0]+1 );
  }
  return s;
}

// handle input from stdin
stdin.resume(); // see http://nodejs.org/docs/v0.4.7/api/process.html#process.stdin
//stdin.setEncoding('utf8');

var alltext = '';

stdin.on('data',function(chunk){ // called on each line of input
  alltext += chunk.toString(); 
});

stdin.on('end',function(){ // called when stdin closes (via ^D)
  var s,i,l = alltext.split('\n');
  for( i=0; i<l.length; ++i ) {
    s = parseStar(l[i]);
    if( ! (s.Spec2 in starcol) ) {
      console.log(s.SpType);
    }
  }
});

