#!/usr/bin/perl

$text="";

$lang = $ARGV[0];
$newrev = $ARGV[1];
$rev = -1;

open( IN, "<rev.inc" );
while(<IN>) {
  if( $_ =~ /^"$lang" => \d+,\n$/ ) {
    $rev = $1;
    print "\"$lang\" => $newrev,\n";
  }
  else { print $_; }
}
close(IN);

#open( OUT, ">rev.inc" );
#print OUT $text;
#close(OUT)

