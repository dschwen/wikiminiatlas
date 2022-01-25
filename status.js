(function() {
  // add thumbs
  var thumbs = []; 
  var map = null;
  var current = null;
  for (let i = 8; i <= 12; ++i)
  {
    var img =
      $('<img/>')
        .attr({'src': 'overview/overview_' + i + '.png', 'width': '200px'})
        .click(function(e) {
          if (this == current)
          {
            var x = e.offsetX;
            var y = e.offsetY;
            var w = e.target.offsetWidth;
            var h = e.target.offsetHeight;
            lon = x/w*360.0;
            lat = (0.5-y/h)*180.0;
            if (lon > 180) {
              lon = lon - 360.0;
            }
            if (map == null) {
              map = $('<iframe/>').attr({'width': '800', 'height': '600'}).appendTo('#map')
            }
            var lang = 'en';
            map.attr('src', 'iframe_dev.html?wma='+lat+'_'+lon+'_800_600_' + lang + '_3_' + lang + '&globe=Earth&lang=' + lang);
          }
          else
          {
            $.each(thumbs, (i, e) => { e.attr('width', '200px'); });
            $(this).removeAttr('width');
            current = this;
          }
        });

    thumbs.push(img);
    
    $('<span/>').css('padding', '1em').append(img).appendTo('#overview');
  }
})();
