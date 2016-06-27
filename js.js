$(document).ready(function() {

  $('dl.content-contents dt a').each(function(){
    $('.abc_index').append('<a href="#' + $(this).attr('name') + '">' + $(this).text() + '</a>');
  });

  doubleHover('a', 'hover');

  $(window).hashchange( function(){
    activateChords();
  })
  $(window).hashchange();

  goToLetter();
});

function goToLetter() {
  var a = {
    49  : 'top',
    70  : 'top',
    188 : 'b',
    68  : 'v',
    85  : 'g',
    76  : 'd',
    84  : 'e',
    186 : 'zh',
    80  : 'z',
    66  : 'i',
    82  : 'k',
    75  : 'l',
    86  : 'm',
    89  : 'n',
    74  : 'o',
    71  : 'p',
    72  : 'r',
    67  : 's',
    78  : 't',
    69  : 'u',
    65  : 'f',
    219 : 'x',
    87  : 'c',
    88  : 'ch',
    73  : 'sh',
    79  : 'w',
    222 : 'eh',
    190 : 'ju',
    90  : 'ja'
  }

  var keys = {};

  $(document).keydown(function (e) {
    var k = a[e.which];
    if (JSON.stringify(keys).length <= 2) {
      keys[e.which] = true;

      if (k) {
        location.hash = "#" + k;
      }
    }
  });

  $(document).keyup(function (e) {
      delete keys[e.which];
  });

}

// «doubleHover» by artpolikarpov
var doubleHover = function(selector, hoverClass) {
  $(document).on('mouseover mouseout', selector, function(e) {
    $(selector)
      .filter('[href="' + $(this).attr('href') + '"]')
      .toggleClass(hoverClass, e.type == 'mouseover');
  });
};

var currTrack = "";

function activateChords(thisObj) {
  if (thisObj) {
    currTrack = thisObj.attr('href').substring(1);
  }
  else if (document.location.hash.length > 3 && document.location.hash != '#top') {
    currTrack = document.location.hash.substring(1);
  }
  else {
    $.modal().close();
    return false;
  }
  var currChords = $('.display .chords_text[data-chords-id="' + currTrack +'"]').clone();
  $('.modal').empty().html(currChords);
  $('.modal').modal().open();
  $.modal({
    onClose: function(){
      clearAddress()
    }
  });
  $('.modal').focus();
};

var clearAddress = function() {
  // document.location.hash = "";
  currTrack = "";
  history.pushState('', '', window.location.href.split('#')[0]);
};
