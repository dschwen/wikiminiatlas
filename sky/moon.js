//
// doCalcs is written like a BASIC program - most of the calculation
// occurs in this function, although a few things are split off into
// separate functions. This function also reads the date, does some
// basic error checking, and writes all the results!
//

function doCalcs(form) {
  var g, days,t ,L1, M1, C1, V1, Ec1, R1, Th1, Om1, Lam1, Obl, Ra1, Dec1;
  var F, L2, Om2, M2, D, R2, R3, Bm, Lm, HLm, HBm, Ra2, Dec2, EL, EB, W, X, Y, A; 
  var Co, SLt, Psi, Il, K, P1, P2, y, m, d, bit, h, min, bk;
//
//	Get date and time code from user, isolate the year, month, day and hours
//	and minutes, and do some basic error checking! This only works for AD years
//
	// t = days / 36525; Julian Centuries since J2000

//
//	Sun formulas
//
//	L1	- Mean longitude
//	M1	- Mean anomaly
//	C1	- Equation of centre
//	V1	- True anomaly
//	Ec1	- Eccentricity 
//	R1	- Sun distance
//	Th1	- Theta (true longitude)
//	Om1	- Long Asc Node (Omega)
//	Lam1- Lambda (apparent longitude)
//	Obl	- Obliquity of ecliptic
//	Ra1	- Right Ascension
//	Dec1- Declination
//

  L1 = range(280.466 + 36000.8 * t);
  M1 = range(357.529+35999*t - 0.0001536* t*t + t*t*t/24490000);
  C1 = (1.915 - 0.004817* t - 0.000014* t * t)* dsin(M1);	 
  C1 = C1 + (0.01999 - 0.000101 * t)* dsin(2*M1);
  C1 = C1 + 0.00029 * dsin(3*M1);
  V1 = M1 + C1;
  Ec1 = 0.01671 - 0.00004204 * t - 0.0000001236 * t*t;
  R1 = 0.99972 / (1 + Ec1 * dcos(V1));
  Th1 = L1 + C1;
  Om1 = range(125.04 - 1934.1 * t);
  Lam1 = Th1 - 0.00569 - 0.00478 * dsin(Om1);
  Obl = (84381.448 - 46.815 * t)/3600;
  Ra1 = datan2(dsin(Th1) * dcos(Obl) - dtan(0)* dsin(Obl), dcos(Th1));
  Dec1 = dasin(dsin(0)* dcos(Obl) + dcos(0)*dsin(Obl)*dsin(Th1));

//
//	Moon formulas
//
//	F 	- Argument of latitude (F)
//	L2 	- Mean longitude (L')
//	Om2 - Long. Asc. Node (Om')
//	M2	- Mean anomaly (M')
//	D	- Mean elongation (D)
//	D2	- 2 * D
//	R2	- Lunar distance (Earth - Moon distance)
//	R3	- Distance ratio (Sun / Moon)
//	Bm	- Geocentric Latitude of Moon
//	Lm	- Geocentric Longitude of Moon
//	HLm	- Heliocentric longitude
//	HBm	- Heliocentric latitude
//	Ra2	- Lunar Right Ascension
//	Dec2- Declination
//

  F = range(93.2721 + 483202 * t - 0.003403 * t* t - t * t * t/3526000);
  L2 = range(218.316 + 481268 * t);
  Om2 = range(125.045 - 1934.14 * t + 0.002071 * t * t + t * t * t/450000);
  M2 = range(134.963 + 477199 * t + 0.008997 * t * t + t * t * t/69700);
  D = range(297.85 + 445267 * t - 0.00163 * t * t + t * t * t/545900);
  D2 = 2*D;
  R2 = 1 + (-20954 * dcos(M2) - 3699 * dcos(D2 - M2) - 2956 * dcos(D2)) / 385000;
  R3 = (R2 / R1) / 379.168831168831;
  Bm = 5.128 * dsin(F) + 0.2806 * dsin(M2 + F);
  Bm = Bm + 0.2777 * dsin(M2 - F) + 0.1732 * dsin(D2 - F);
  Lm = 6.289 * dsin(M2) + 1.274 * dsin(D2 -M2) + 0.6583 * dsin(D2); 
  Lm = Lm + 0.2136 * dsin(2*M2) - 0.1851 * dsin(M1) - 0.1143 * dsin(2 * F); 
  Lm = Lm +0.0588 * dsin(D2 - 2*M2) 
  Lm = Lm + 0.0572* dsin(D2 - M1 - M2) + 0.0533* dsin(D2 + M2);
  Lm = Lm + L2;
  Ra2 = datan2(dsin(Lm) * dcos(Obl) - dtan(Bm)* dsin(Obl), dcos(Lm));
  Dec2 = dasin(dsin(Bm)* dcos(Obl) + dcos(Bm)*dsin(Obl)*dsin(Lm));
  HLm = range(Lam1 + 180 + (180/Math.PI) * R3 * dcos(Bm) * dsin(Lam1 - Lm));
  HBm = R3 * Bm;


//
//	Selenographic coords of the sub Earth point
//	This gives you the (geocentric) libration 
//	approximating to that listed in most almanacs
//	Topocentric libration can be up to a degree
//	different either way
//
//	Physical libration ignored, as is nutation.
//
//	I	- Inclination of (mean) lunar orbit to ecliptic
//	EL	- Selenographic longitude of sub Earth point
//	EB	- Sel Lat of sub Earth point
//	W	- angle variable
//	X	- Rectangular coordinate
//	Y	- Rectangular coordinate
//	A	- Angle variable (see Meeus ch 51 for notation)
//
  I = 1.54242;
  W = Lm - Om2;
  Y = dcos(W) * dcos(Bm);
  X = dsin(W) * dcos(Bm) * dcos(I) - dsin(Bm) * dsin(I);
  A = datan2(X, Y);
  EL = A - F;
  EB = dasin(-dsin(W) * dcos(Bm) * dsin(I) - dsin(Bm) * dcos(I));

//
//	Selenographic coords of sub-solar point. This point is
//	the 'pole' of the illuminated hemisphere of the Moon
//  and so describes the position of the terminator on the 
//  lunar surface. The information is communicated through
//	numbers like the colongitude, and the longitude of the
//	terminator.
//
//	SL	- Sel Long of sub-solar point
//	SB	- Sel Lat of sub-solar point
//	W, Y, X, A	- temporary variables as for sub-Earth point
//	Co	- Colongitude of the Sun
//	SLt	- Selenographic longitude of terminator 
//	riset - Lunar sunrise or set
//

  W = range(HLm - Om2);
  Y = dcos(W) * dcos(HBm);
  X = dsin(W) * dcos(HBm) * dcos(I) - dsin(HBm) * dsin(I);
  A = datan2(X, Y);
  SL = range(A - F);
  SB = dasin(-dsin(W) * dcos(HBm) * dsin(I) - dsin(HBm) * dcos(I));

  if( SL < 90 ) {
    Co = 90 - SL;
  } else {
    Co = 450 - SL;
  }

  if( ( Co > 90 ) && ( Co < 270 ) ) {
    SLt = 180 - Co;
  } else {
    if( Co < 90 ) {
      SLt = 0 - Co;
    } else {
      SLt = 360 - Co;
    }
  }

//
//	Calculate the illuminated fraction, the position angle of the bright
//	limb, and the position angle of the Moon's rotation axis. All position
//	angles relate to the North Celestial Pole - you need to work out the
//  'Parallactic angle' to calculate the orientation to your local zenith.
//

//	Iluminated fraction
  A = dcos(Bm) * dcos(Lm - Lam1);
  Psi = 90 - datan(A / Math.sqrt(1- A*A));
  X = R1 * dsin(Psi);
  Y = R3 - R1* A;
  Il = datan2(X, Y);
  K = (1 + dcos(Il))/2;

//	PA bright limb
  X = dsin(Dec1) * dcos(Dec2) - dcos(Dec1) * dsin(Dec2) * dcos(Ra1 - Ra2);
  Y = dcos(Dec1) * dsin(Ra1 - Ra2);
  P1 = datan2(Y, X);

//	PA Moon's rotation axis
//	Neglects nutation and physical libration, so Meeus' angle
//	V is just Om2
  X = dsin(I) * dsin(Om2);
  Y = dsin(I) * dcos(Om2) * dcos(Obl) - dcos(I) * dsin(Obl);
  W = datan2(X, Y);
  A = Math.sqrt(X*X + Y*Y) * dcos(Ra2 - W);
  P2 = dasin(A / dcos(EB));			

//
//	Write Sun numbers to form
//

  form.daynumber.value = round(days, 4);
  form.julday.value = round(days + 2451545.0, 4);
  form.SunDistance.value = round(R1, 4);
  form.SunRa.value = round(Ra1 / 15, 3);
  form.SunDec.value = round(Dec1, 2);

//
//	Write Moon numbers to form
//

  form.MoonDist.value = round(R2 * 60.268511, 2);
  form.MoonRa.value = round(Ra2 / 15, 3);
  form.MoonDec.value = round(Dec2, 2);

//
//	Print the libration numbers
//

  form.SelLatEarth.value = round(EB , 1);
  form.SelLongEarth.value = round(EL, 1);

//
//	Print the Sub-solar numbers
//

	form.SelLatSun.value = round(SB , 1);
	form.SelLongSun.value = round(SL, 1);
	form.SelColongSun.value = round(Co, 2);
	form.SelLongTerm.value = round(SLt, 1);

//
//	Print the rest - position angles and illuminated fraction
//

	form.SelIlum.value = round(K, 3);
	form.SelPaBl.value = round(P1, 1);
	form.SelPaPole.value = round(P2, 1);
}

function dsin(x) {
  return Math.sin(Math.PI / 180 * x)
}

function dcos(x) {
  return Math.cos(Math.PI / 180 * x)
}

function dtan(x) {
  return Math.tan(Math.PI / 180 * x)
}

function dasin(x) {
  return 180/ Math.PI * Math.asin(x)
}

function dacos(x) {
  return 180/ Math.PI * Math.acos(x)
}

function datan(x) {
  return 180/ Math.PI * Math.atan(x)
}

function datan2(y, x) {
  return Math.atan2(y,x)*180/Math.PI;
}

function range(x) {
  return x - Math.floor(x/360)*360;
}

