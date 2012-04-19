var util=require('util'),
    stdin=process.stdin;

// dat format
function parseStar(line) {
  var i, s = {},
      // 125533-6047230
      format = [
        [1,2,'RAh'],      //  Hours RA, equinox J2000, epoch 2000.0 (1)
        [3,4,'RAm'],      //  Minutes RA, equinox J2000, epoch 2000.0 (1)
        [5,6,'RAs'],      //  Seconds RA, equinox J2000, epoch 2000.0 (1)
        [7,7,'DEx'],      //  Sign Dec, equinox J2000, epoch 2000.0 (1)
        [8,9,'DEd'],      //  Degrees Dec, equinox J2000, epoch 2000.0 (1)
        [10,11,'DEm'],      //  Minutes Dec, equinox J2000, epoch 2000.0 (1)
        [12,14,'DEst'],      // 10* Seconds Dec, equinox J2000, epoch 2000.0 (1)
      ];
  for( i=0; i<format.length; ++i ) {
    s[format[i][2]] = line.substr( format[i][0]-1, format[i][1]-format[i][0]+1 );
  }
  return s;
}

function processDot(s) {
  var p = { ra: 0, de: 0, mag: 5, c: '255,255,255' }, t;
  p.ra = ( ( parseFloat(s.RAh) + ( parseFloat(s.RAm) + parseFloat(s.RAs)/60.0 )/60.0 )/24.0 ) * 2.0*Math.PI;
  p.de = ( ( parseFloat(s.DEd) + ( parseFloat(s.DEm) + parseFloat(s.DEst)/600.0 )/60.0 )/360.0 ) * 2.0*Math.PI * (s.DEx=='-'?-1:1); 
  return p;
}

// handle input from stdin
stdin.resume(); // see http://nodejs.org/docs/v0.4.7/api/process.html#process.stdin
//stdin.setEncoding('utf8');

var alltext = '';

stdin.on('data',function(chunk){ // called on each line of input
  alltext += chunk.toString(); 
});

stdin.on('end',function(){ // called when stdin closes (via ^D)
  var s,i,l = alltext.split('\n'),p=[], q, t;
  for( i=0; i<l.length; ++i ) {
    s = parseStar(l[i]);

    q = processDot(s);
    if( q.mag || q.mag===0 ) {
      p.push( q );
    }
  }
  //p.sort( function(a,b) { return a.mag-b.mag; } );
  console.log(JSON.stringify(p));
});

