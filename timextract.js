$(function(){
  var r = {};
 
  $('.vevent').each(function(i,e){
    var a = $('.dtstart').attr('title')
      , b = $('.dtend').attr('title')
      , s, e;
    if(a||b) {
      (r.mf=r.mf||[]).push([a,b]);
    }
  });
 
  $('a[title^="Category:"]').each(function(i,e){
    var m = /^([\d]{4}) (BC |)in /.exec($(e).text());
    if(m) { (r.loc=r.loc||[]).push(m[1]*(m[2]==''?1:-1)); }
  });
  if( r.loc ) { // remove duplicate year numbers
    var i,obj={};
    for(i=0;i<r.loc.length;++i){ obj[r.loc[i]]=1; }
    r.loc=[];
    for(i in obj){ r.loc.push(i); }
  }
 
  $('a[title$=" births"],a[title$=" deaths"]').each(function(i,e){
    var m = /^([\d]{1,4}) (BC |)(births|deaths)$/.exec($(e).text()), y;
    if(m) { (r[m[3]]=r[m[3]]||[]).push(m[1]*(m[2]==''?1:-1)); }
  });
 
  var d = $('th:contains(Date)').parent().find('td').eq(0).text();
  if(d) { (r.table=r.table||[]).push(d); }
 
  console.log(wgTitle, JSON.stringify(r));
});

